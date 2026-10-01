import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import { useAuthStore } from '../store/authStore';
import CouponForm from '../components/CouponForm';
import { useCouponStore } from '../store/couponStore';
import ShippingSelector from '../components/ShippingSelector';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
// A chave publica vem do backend, sempre do mesmo par da chave secreta
const stripePromise = axios
  .get(`${API_URL}/payment/config`)
  .then((res) => loadStripe(res.data.publishableKey))
  .catch(() => null);

const REGION_CONFIG = {
  BR: { name: 'Brasil', currency: 'BRL', symbol: 'R$', taxRate: 0.18, country: 'BR' },
  PT: { name: 'Portugal', currency: 'EUR', symbol: '€', taxRate: 0.23, country: 'PT' },
  EU: { name: 'Europa', currency: 'EUR', symbol: '€', taxRate: 0.21, country: 'EU' },
};

function PaymentForm({ orderId, label, onBack, onPaid, setError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    setError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setBusy(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await axios.post(`${API_URL}/payment/stripe/confirm`, {
          paymentIntentId: paymentIntent.id,
          orderId,
        });
      } catch (err) {
        // O webhook do Stripe tambem confirma o pedido; nao bloqueia o cliente
        console.error('Confirm call failed:', err);
      }
      onPaid(orderId);
      return;
    }

    setError('Payment is being processed. You will receive an email when it is confirmed.');
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="button-group" style={{ marginTop: '24px' }}>
        <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
          Back
        </button>
        <button type="submit" className="btn-primary" disabled={!stripe || busy}>
          {busy ? 'Processing...' : label}
        </button>
      </div>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, cartId, clearCart } = useCartStore();
  const { region } = useRegionStore();
  const { user, token, getAuthHeader } = useAuthStore();
  const regionConfig = REGION_CONFIG[region];
  const [step, setStep] = useState(1); // 1: Address, 2: Shipping, 3: Review & Pay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null); // { orderId, clientSecret }

  const [formData, setFormData] = useState({
    customerEmail: user?.email || '',
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    cep: '',
  });

  const [shippingData, setShippingData] = useState({
    selectedMethod: null,
    cost: 0,
    options: [],
  });



  // Check authentication
  useEffect(() => {
    if (!token) {
      alert('Please log in to checkout');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    if (!formData.customerEmail || !formData.customerName || !formData.street || 
        !formData.city || !formData.state || !formData.cep) {
      setError('Please fill in all address fields');
      return false;
    }
    return true;
  };

  const handleCalculateShipping = async () => {
    if (!validateAddress()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/shipping/calculate`, {
        destination: formData.city,
        weight: items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0),
        items: items.map(item => ({ weight: item.weight || 1, quantity: item.quantity })),
        region: region,
      });

      setShippingData({
        selectedMethod: response.data.options[0]?.id,
        cost: response.data.options[0]?.price || 0,
        options: response.data.options,
      });

      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate shipping');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingMethodChange = (methodId) => {
    const selected = shippingData.options.find(opt => opt.id === methodId);
    setShippingData({
      ...shippingData,
      selectedMethod: methodId,
      cost: selected?.price || 0,
    });
  };

  const calculateTotals = () => {
    const taxRate = regionConfig.taxRate;
    const subtotal = total;
    const tax = subtotal * taxRate;
    const shipping = shippingData.cost;
    const finalTotal = subtotal + tax + shipping;

    return { subtotal, tax, shipping, finalTotal };
  };

  // Cria o pedido (o servidor recalcula precos) e a cobranca; so entao mostra o formulario do Stripe
  const startPayment = async () => {
    if (!shippingData.selectedMethod) {
      setError('Please select a shipping method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderResponse = await axios.post(`${API_URL}/orders`, {
        cartId,
        items: items.map(item => ({
          product_id: item.productId || item.id || item.product_id,
          quantity: item.quantity,
        })),
        userId: user?.id,
        customerEmail: formData.customerEmail,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        shippingAddress: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
          cep: formData.cep,
        },
        shippingCost: shippingData.cost,
        paymentMethod: 'stripe',
        currency: regionConfig.currency,
        region,
      }, {
        headers: getAuthHeader(),
      });

      const orderId = orderResponse.data.orderId || orderResponse.data.id;

      const intentResponse = await axios.post(`${API_URL}/payment/stripe/create-intent`, { orderId });

      setPayment({ orderId, clientSecret: intentResponse.data.clientSecret });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = (orderId) => {
    clearCart();
    navigate(`/checkout/success?orderId=${orderId}`);
  };
  const { subtotal, tax, shipping, finalTotal } = calculateTotals();

  if (!items || items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <button className="btn-primary" onClick={() => navigate('/shop')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Address</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Shipping</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Payment</div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          {error && <div className="error-message">{error}</div>}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="checkout-step">
              <h2>Shipping Address</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    disabled={!!user}
                  />
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    disabled={!!user}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Complement (optional)</label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    placeholder="Apto, bloco, referencia"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Number</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>State/Region</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    placeholder="12345-678 or 12345678"
                  />
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  if (validateAddress()) {
                    setStep(2);
                  }
                }}
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="checkout-step">
              <h2>Select Shipping Method</h2>
              <ShippingSelector
                country={region}
                zipCode={formData.cep}
                cartWeight={items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0)}
                onShippingSelect={(option) => {
                  setShippingData({
                    selectedMethod: option.id,
                    cost: option.price,
                    options: [option],
                  });
                }}
              />

              <div className="button-group" style={{ marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={startPayment}
                  disabled={!shippingData.selectedMethod || loading}
                >
                  {loading ? 'Preparing payment...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && payment && (
            <div className="checkout-step">
              <h2>Payment Details</h2>
              <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
                <PaymentForm
                  orderId={payment.orderId}
                  label={`Pay ${regionConfig.symbol} ${finalTotal.toFixed(2)}`}
                  onBack={() => { setPayment(null); setStep(2); }}
                  onPaid={handlePaid}
                  setError={setError}
                />
              </Elements>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {items.map((item) => (
              <div key={item.id || item.product_id} className="summary-item">
                <span>{item.name || item.product_name} x {item.quantity}</span>
                <span>{regionConfig.symbol} {((item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="summary-line"></div>

          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{regionConfig.symbol} {subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Tax ({(regionConfig.taxRate * 100).toFixed(0)}%):</span>
            <span>{regionConfig.symbol} {tax.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping:</span>
            <span>{regionConfig.symbol} {shipping.toFixed(2)}</span>
          </div>

          <div className="summary-line"></div>

          <div className="summary-total">
            <span>Total:</span>
            <span>{regionConfig.symbol} {finalTotal.toFixed(2)}</span>
          </div>

          <div className="region-info">
            <strong>{regionConfig.name}</strong>
            <span>{regionConfig.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
