import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useI18n } from '../i18n';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const orderId = searchParams.get('orderId');
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Mostra o numero do pedido (e nao o ID interno)
  useEffect(() => {
    if (!orderId) return;
    axios.get(`${API_URL}/orders/${orderId}`)
      .then(({ data }) => setOrderNumber(data.order_number || ''))
      .catch(() => {});
  }, [orderId]);

  const label = {fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 32px', border: '1px solid #000', cursor: 'pointer', textTransform: 'uppercase'};

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-32 px-6 text-center">
        <div style={{marginBottom: '32px'}}>
          <div style={{fontSize: '64px', marginBottom: '16px'}}>✓</div>
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('success.title')}
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {t('success.thanks')}
          </p>
        </div>

        <div style={{maxWidth: '600px', margin: '0 auto', marginBottom: '48px'}}>
          <div style={{border: '1px solid #000', padding: '32px', marginBottom: '24px'}}>
            <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', color: '#999', textTransform: 'uppercase'}}>
              {t('success.number')}
            </p>
            <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', marginBottom: '24px'}}>
              {orderNumber ? `#${orderNumber}` : '…'}
            </p>

            <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666', lineHeight: '1.6'}}>
              {t('success.emailSent')} <br/>
              {t('success.track')}
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/shop')} style={{...label, background: '#000', color: '#fff'}}>
            {t('success.continue')}
          </button>
          <button onClick={() => navigate('/')} style={{...label, background: '#fff', color: '#000'}}>
            {t('success.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
