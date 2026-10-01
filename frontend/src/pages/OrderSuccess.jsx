import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-32 px-6 text-center">
        <div style={{marginBottom: '32px'}}>
          <div style={{fontSize: '64px', marginBottom: '16px'}}>✓</div>
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            Order Confirmed
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            Thank you for your purchase!
          </p>
        </div>

        <div style={{maxWidth: '600px', margin: '0 auto', marginBottom: '48px'}}>
          <div style={{border: '1px solid #000', padding: '32px', marginBottom: '24px'}}>
            <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', color: '#999', textTransform: 'uppercase'}}>
              Order Number
            </p>
            <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', marginBottom: '24px'}}>
              {orderId || 'Loading...'}
            </p>

            <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666', lineHeight: '1.6'}}>
              A confirmation email has been sent to your email address. <br/>
              You can track your order status anytime from your account.
            </p>
          </div>

          <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '1px', color: '#999', marginBottom: '24px', textTransform: 'uppercase'}}>
            Expected Delivery: 5-7 Business Days
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/shop')}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 32px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 32px', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
