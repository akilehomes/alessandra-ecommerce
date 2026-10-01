import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import ShippingCalculator from '../components/ShippingCalculator';

const REGION_CONFIG = {
  BR: { name: 'Brasil', symbol: 'R$', tax: 0.18 },
  PT: { name: 'Portugal', symbol: '€', tax: 0.23 },
  EU: { name: 'Europa', symbol: '€', tax: 0.21 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeItem, applyCoupon } = useCartStore();
  const { region } = useRegionStore();
  const regionConfig = REGION_CONFIG[region];
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(null); // opcao de frete escolhida (somente Brasil)

  const handleApplyCoupon = async () => {
    try {
      const result = await applyCoupon(couponCode);
      setDiscount(result.discountAmount);
      alert('Cupom aplicado!');
    } catch (error) {
      alert(error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-24 px-6 text-center">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            Cart
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', marginBottom: '32px', color: '#666'}}>
            Seu carrinho está vazio
          </p>
          <button
            onClick={() => navigate('/shop')}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '10px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-24 px-6">
        <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '32px', textTransform: 'uppercase'}}>
          Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 py-6 border-b border-gray-200">
                <img
                  src={item.image_url || item.image}
                  alt={item.name}
                  style={{width: '120px', height: '120px', objectFit: 'cover', backgroundColor: '#f5f5f5'}}
                />
                <div className="flex-1">
                  <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase'}}>
                    {item.name}
                  </h3>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '16px'}}>
                    {regionConfig.symbol} {Number(item.price).toFixed(2)}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer'}}
                      >
                        −
                      </button>
                      <span style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px 12px', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd'}}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer'}}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', cursor: 'pointer', textDecoration: 'underline'}}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{textAlign: 'right'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700'}}>
                    {regionConfig.symbol} {(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            {region === 'BR' && (
              <ShippingCalculator
                bare
                selectable
                autoCalculate
                symbol={regionConfig.symbol}
                items={items.map((item) => ({ productId: item.productId, quantity: item.quantity }))}
                onSelect={setShipping}
              />
            )}
          </div>

          {/* Summary */}
          <div>
            <div style={{border: '1px solid #000', padding: '24px'}}>
              <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase'}}>
                Order Summary
              </h2>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '16px', textTransform: 'uppercase'}}>
                {regionConfig.name}
              </p>

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px'}}>
                <span>Subtotal:</span>
                <span>{regionConfig.symbol} {total.toFixed(2)}</span>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#d97706'}}>
                <span>Tax ({Math.round(regionConfig.tax * 100)}%):</span>
                <span>{regionConfig.symbol} {(total * regionConfig.tax).toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#10b981'}}>
                  <span>Discount:</span>
                  <span>-{regionConfig.symbol} {discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px'}}>
                <span>Shipping:</span>
                <span>
                  {shipping ? `${regionConfig.symbol} ${Number(shipping.price).toFixed(2)}` : (region === 'BR' ? 'Informe o CEP' : 'TBD')}
                </span>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #000', marginBottom: '20px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700'}}>
                <span>Total:</span>
                <span>{regionConfig.symbol} {(total + (total * regionConfig.tax) - discount + (shipping ? Number(shipping.price) : 0)).toFixed(2)}</span>
              </div>

              {/* Coupon Input */}
              <div style={{marginBottom: '16px'}}>
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', width: '100%', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', marginBottom: '12px', background: 'transparent'}}
                />
                <button
                  onClick={handleApplyCoupon}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', padding: '8px', width: '100%', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer', textTransform: 'uppercase'}}
                >
                  Apply Coupon
                </button>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px', width: '100%', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '12px'}}
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate('/shop')}
                style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px', width: '100%', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer', textTransform: 'uppercase'}}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
