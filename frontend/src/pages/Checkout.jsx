import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import { useAuthStore } from '../store/authStore';
import CouponForm from '../components/CouponForm';
import { useCouponStore, computeDiscount } from '../store/couponStore';
import ShippingSelector from '../components/ShippingSelector';
import AddressPicker from '../components/AddressPicker';
import DocumentFields from '../components/DocumentFields';
import { useCountries, emptyAddress } from '../utils/geo';
import { ptError } from '../utils/errors';
import '../components/Forms.css';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
// A chave publica vem do backend, sempre do mesmo par da chave secreta
const stripePromise = axios
  .get(`${API_URL}/payment/config`)
  .then((res) => loadStripe(res.data.publishableKey))
  .catch(() => null);

// Aliquotas por regiao do destino (o servidor recalcula; isto e so a previa do resumo)
const TAX_RATE = { BR: 0.18, PT: 0.23, EU: 0.21 };

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
      setError(error.message || 'O pagamento não foi concluído. Tente novamente.');
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

    setError('Seu pagamento está sendo processado. Você receberá um e-mail quando for confirmado.');
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="button-group" style={{ marginTop: '24px' }}>
        <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
          Voltar
        </button>
        <button type="submit" className="btn-primary" disabled={!stripe || busy}>
          {busy ? 'Processando…' : label}
        </button>
      </div>
    </form>
  );
}


const readSavedCep = () => {
  try {
    return (localStorage.getItem('shippingCep') || '').replace(/\D/g, '');
  } catch (e) {
    return '';
  }
};

const money = (symbol, v) => `${symbol} ${Number(v || 0).toFixed(2)}`;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, cartId, clearCart, syncStock } = useCartStore();
  const { region: siteRegion } = useRegionStore();
  const { appliedCoupon, removeCoupon } = useCouponStore();
  const { user, token, getAuthHeader, updateProfile, fetchUser } = useAuthStore();
  const countries = useCountries();

  const [step, setStep] = useState(1); // 1: Dados e endereco, 2: Frete, 3: Pagamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null); // { orderId, clientSecret }

  const defaultCountry = user?.country || (siteRegion === 'PT' ? 'PT' : 'BR');
  const [contact, setContact] = useState({ email: user?.email || '', name: user?.name || '', phone: user?.phone || '' });
  const [savedShipping, setSavedShipping] = useState([]);
  const [savedBilling, setSavedBilling] = useState([]);
  const [shipId, setShipId] = useState(undefined); // undefined = ainda nao escolheu; 'new' = digitando
  const [billId, setBillId] = useState(undefined);
  const [addr, setAddr] = useState({ ...emptyAddress(defaultCountry), recipient_name: user?.name || '', postal_code: defaultCountry === 'BR' ? readSavedCep() : '' });
  const [billingSame, setBillingSame] = useState(true);
  const [billAddr, setBillAddr] = useState(emptyAddress(defaultCountry));
  const [fiscal, setFiscal] = useState({
    person_type: user?.person_type || 'individual',
    company_name: user?.company_name || '',
    document_number: user?.document_number || '',
  });
  const [saveForLater, setSaveForLater] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [shippingData, setShippingData] = useState({ selectedMethod: null, cost: 0, options: [] });

  // Exige login
  useEffect(() => {
    if (!token) {
      alert('Entre na sua conta para finalizar a compra.');
      navigate('/login');
    }
  }, [token, navigate]);

  // Confere preco e estoque atuais dos itens; recarrega o perfil completo (documento, telefone) e os enderecos salvos
  useEffect(() => { syncStock(); }, [syncStock]);
  useEffect(() => { if (token) fetchUser(); }, [token, fetchUser]);
  useEffect(() => {
    setContact((c) => ({ email: c.email || user?.email || '', name: c.name || user?.name || '', phone: c.phone || user?.phone || '' }));
  }, [user?.email, user?.name, user?.phone]);
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/addresses`, { headers: getAuthHeader() })
      .then(({ data }) => {
        setSavedShipping(data.filter((a) => a.kind === 'shipping'));
        setSavedBilling(data.filter((a) => a.kind === 'billing'));
        if (!data.some((a) => a.kind === 'shipping')) setShipId('new');
        if (!data.some((a) => a.kind === 'billing')) setBillId('new');
      })
      .catch(() => { setShipId('new'); setBillId('new'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const countryInfo = countries.find((c) => c.code === addr.country);
  const destRegion = countryInfo ? countryInfo.region : 'BR';
  const currency = countryInfo ? countryInfo.currency : 'BRL';
  const symbol = currency === 'EUR' ? '€' : 'R$';
  const billCountry = billingSame ? addr.country : billAddr.country;

  // Em euro, usa o preco em euro de cada produto
  const unitPrice = (item) => (currency === 'EUR' ? (item.price_eur == null ? null : Number(item.price_eur)) : Number(item.price));
  const unavailableInCountry = currency === 'EUR' && items.some((i) => i.price_eur == null);
  const subtotal = items.reduce((sum, i) => sum + (unitPrice(i) || 0) * i.quantity, 0);
  const discount = currency === 'BRL' ? computeDiscount(appliedCoupon, subtotal) : 0;
  const tax = Math.round(subtotal * (TAX_RATE[destRegion] ?? TAX_RATE.BR) * 100) / 100;
  const shipping = shippingData.cost;
  const finalTotal = subtotal + tax + shipping - discount;

  // O documento salvo no perfil so vale para o pais dele (CPF nao serve para Portugal)
  useEffect(() => {
    const userCountry = user?.country || 'BR';
    setFiscal((f) => ({
      person_type: user?.person_type || f.person_type,
      company_name: user?.company_name || f.company_name,
      document_number: billCountry === userCountry ? (user?.document_number || '') : '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billCountry, user?.document_number, user?.country]);

  // Trocar de pais invalida o frete escolhido
  useEffect(() => {
    setShippingData({ selectedMethod: null, cost: 0, options: [] });
  }, [addr.country, addr.postal_code]);

  const validateStep1 = () => {
    if (!contact.email || !contact.name) return 'Preencha seu nome e e-mail.';
    if (!addr.recipient_name || !addr.street || !addr.city || !addr.postal_code) return 'Preencha o endereço de entrega completo.';
    if (addr.country === 'BR' && (!addr.number || !addr.district || !addr.state)) return 'Informe número, bairro e estado.';
    if (!billingSame && (!billAddr.recipient_name || !billAddr.street || !billAddr.city || !billAddr.postal_code)) return 'Preencha o endereço de faturamento.';
    const rules = countryInfo && countryInfo.documents ? countryInfo.documents : null;
    const docInfo = (countries.find((c) => c.code === billCountry) || {}).documents;
    const needsDoc = docInfo ? docInfo[fiscal.person_type === 'company' ? 'company' : 'individual'].required : rules === null;
    if (needsDoc && !fiscal.document_number) return billCountry === 'BR' ? 'Informe o CPF ou CNPJ para a nota fiscal.' : 'Informe o número de IVA / VAT da empresa.';
    if (fiscal.person_type === 'company' && !fiscal.company_name) return 'Informe a razão social da empresa.';
    if (unavailableInCountry) return 'Algum produto do carrinho ainda não está à venda neste país. Escolha outro país ou revise o carrinho.';
    if (!acceptTerms) return 'Para continuar, aceite os Termos de uso e a Política de privacidade.';
    return null;
  };

  const goShipping = () => {
    const problem = validateStep1();
    if (problem) { setError(problem); return; }
    setError(null);
    setShippingData({ selectedMethod: null, cost: 0, options: [] });
    setStep(2);
  };

  // Cria o pedido (o servidor recalcula precos, frete e impostos) e a cobranca; so entao mostra o formulario do Stripe
  const startPayment = async () => {
    if (!shippingData.selectedMethod) {
      setError('Escolha uma forma de envio.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const billingPayload = billingSame ? undefined : { ...billAddr };
      const orderResponse = await axios.post(`${API_URL}/orders`, {
        cartId,
        items: items.map((item) => ({ product_id: item.productId || item.id || item.product_id, quantity: item.quantity })),
        customerEmail: contact.email,
        customerName: contact.name,
        customerPhone: contact.phone || addr.phone,
        shippingAddress: { ...addr },
        billingSameAsShipping: billingSame,
        billingAddress: billingPayload,
        customerPersonType: fiscal.person_type,
        customerCompanyName: fiscal.company_name,
        customerDocumentNumber: fiscal.document_number,
        shippingMethodId: shippingData.selectedMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentMethod: 'stripe',
      }, { headers: getAuthHeader() });

      const orderId = orderResponse.data.orderId || orderResponse.data.id;
      const intentResponse = await axios.post(`${API_URL}/payment/stripe/create-intent`, { orderId });
      setPayment({ orderId, clientSecret: intentResponse.data.clientSecret });
      setStep(3);

      // Guarda os dados para as proximas compras (silencioso: falhar aqui nao atrapalha o pagamento)
      if (saveForLater) saveCustomerData();
    } catch (err) {
      const apiError = err.response?.data?.error || '';
      if (/coupon/i.test(apiError)) {
        removeCoupon();
        setError('Seu cupom não é mais válido e foi removido. Revise o total e continue.');
      } else {
        setError(ptError(err, 'Não foi possível iniciar o pagamento. Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCustomerData = async () => {
    try {
      await updateProfile({
        name: contact.name,
        phone: contact.phone || addr.phone || undefined,
        country: billCountry,
        person_type: fiscal.person_type,
        company_name: fiscal.company_name,
        document_number: fiscal.document_number,
      });
      if (shipId === 'new') {
        await axios.post(`${API_URL}/addresses`, { ...addr, kind: 'shipping', is_default: savedShipping.length === 0 }, { headers: getAuthHeader() });
      }
      if (!billingSame && billId === 'new') {
        await axios.post(`${API_URL}/addresses`, { ...billAddr, kind: 'billing', is_default: savedBilling.length === 0 }, { headers: getAuthHeader() });
      }
    } catch (e) {
      console.warn('Could not save customer data:', e.message);
    }
  };

  const handlePaid = (orderId) => {
    clearCart();
    removeCoupon();
    navigate(`/checkout/success?orderId=${orderId}`);
  };

  if (!items || items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Seu carrinho está vazio</h2>
          <button className="btn-primary" onClick={() => navigate('/shop')}>Continuar comprando</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Finalizar compra</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Dados e endereço</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Envio</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Pagamento</div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          {error && <div className="error-message">{error}</div>}

          {step === 1 && (
            <div className="checkout-step">
              <h2>Seus dados</h2>
              <div className="fx-grid" style={{ marginBottom: 24 }}>
                <div className="fx-field">
                  <label htmlFor="ck-email">E-mail</label>
                  <input id="ck-email" type="email" value={contact.email} disabled={!!user} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" />
                </div>
                <div className="fx-field">
                  <label htmlFor="ck-name">Nome completo</label>
                  <input id="ck-name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" />
                </div>
                <div className="fx-field full">
                  <label htmlFor="ck-phone">Telefone / WhatsApp</label>
                  <input id="ck-phone" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" placeholder="+55 11 99999-9999" />
                </div>
              </div>

              <h2>Endereço de entrega</h2>
              <AddressPicker
                saved={savedShipping}
                selectedId={shipId}
                onSelect={setShipId}
                value={addr}
                onChange={setAddr}
                idPrefix="ship"
                defaultCountry={defaultCountry}
              />

              <h2 style={{ marginTop: 28 }}>Faturamento e nota fiscal</h2>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 14px', fontSize: 14 }}>
                <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
                O endereço de faturamento é o mesmo da entrega
              </label>
              {!billingSame && (
                <div style={{ marginBottom: 18 }}>
                  <AddressPicker
                    saved={savedBilling}
                    selectedId={billId}
                    onSelect={setBillId}
                    value={billAddr}
                    onChange={setBillAddr}
                    idPrefix="bill"
                    showPhone={false}
                    defaultCountry={defaultCountry}
                  />
                </div>
              )}
              <DocumentFields
                country={billCountry}
                value={fiscal}
                onChange={(v) => setFiscal({ ...fiscal, ...v })}
                idPrefix="ck"
              />

              <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '20px 0 8px', fontSize: 14 }}>
                <input type="checkbox" checked={saveForLater} onChange={(e) => setSaveForLater(e.target.checked)} />
                Salvar estes dados na minha conta para as próximas compras
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '0 0 20px', fontSize: 14 }}>
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  Li e aceito os <Link to="/legal/termos" target="_blank">Termos de uso</Link>, a <Link to="/legal/privacidade" target="_blank">Política de privacidade</Link> e a <Link to="/legal/trocas" target="_blank">Política de trocas e devoluções</Link>.
                </span>
              </label>

              <button className="btn-primary" onClick={goShipping}>Continuar para o envio</button>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step">
              <h2>Forma de envio</h2>
              <ShippingSelector
                country={addr.country}
                zipCode={addr.postal_code}
                items={items.map((item) => ({ productId: item.productId || item.id || item.product_id, quantity: item.quantity }))}
                onShippingSelect={(option) => {
                  setShippingData({ selectedMethod: option.id, cost: option.price, options: [option] });
                }}
              />
              <div className="button-group" style={{ marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                <button className="btn-primary" onClick={startPayment} disabled={!shippingData.selectedMethod || loading}>
                  {loading ? 'Preparando pagamento…' : 'Continuar para o pagamento'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && payment && (
            <div className="checkout-step">
              <h2>Pagamento</h2>
              <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
                <PaymentForm
                  orderId={payment.orderId}
                  label={`Pagar ${money(symbol, finalTotal)}`}
                  onBack={() => { setPayment(null); setStep(2); }}
                  onPaid={handlePaid}
                  setError={setError}
                />
              </Elements>
            </div>
          )}
        </div>

        <div className="order-summary">
          <h3>Resumo do pedido</h3>
          <div className="summary-items">
            {items.map((item) => (
              <div key={item.productId || item.id || item.product_id} className="summary-item">
                <span>{item.name || item.product_name} × {item.quantity}</span>
                <span>{unitPrice(item) == null ? '—' : money(symbol, unitPrice(item) * item.quantity)}</span>
              </div>
            ))}
          </div>
          {unavailableInCountry && (
            <p className="fx-hint" style={{ color: '#b91c1c' }}>Algum item ainda não tem preço para este país.</p>
          )}

          <div className="summary-line"></div>
          <div className="summary-row"><span>Subtotal:</span><span>{money(symbol, subtotal)}</span></div>
          {discount > 0 && (
            <div className="summary-row"><span>Desconto ({appliedCoupon.code}):</span><span>-{money(symbol, discount)}</span></div>
          )}
          <div className="summary-row"><span>Impostos ({((TAX_RATE[destRegion] ?? TAX_RATE.BR) * 100).toFixed(0)}%):</span><span>{money(symbol, tax)}</span></div>
          <div className="summary-row"><span>Envio:</span><span>{step >= 2 && shippingData.selectedMethod ? money(symbol, shipping) : 'a calcular'}</span></div>
          <div className="summary-line"></div>
          <div className="summary-total"><span>Total:</span><span>{money(symbol, finalTotal)}</span></div>
          <div className="region-info">
            <strong>{countryInfo ? countryInfo.name : 'Brasil'}</strong>
            <span>{currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
