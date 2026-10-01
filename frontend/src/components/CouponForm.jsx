import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function CouponForm({ subtotal, onCouponApplied, onCouponRemoved }) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode,
        subtotal: subtotal
      });

      setAppliedCoupon(response.data);
      setCouponCode('');
      
      if (onCouponApplied) {
        onCouponApplied(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError(null);
    
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      marginBottom: '24px'
    }}>
      {!appliedCoupon ? (
        <>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Aplicar Cupom de Desconto
          </h3>
          
          <form onSubmit={handleApplyCoupon} style={{
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px'
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!couponCode || loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </button>
          </form>

          {error && (
            <p style={{
              color: '#dc2626',
              fontSize: '13px',
              marginTop: '8px',
              margin: '8px 0 0 0',
              fontFamily: 'Outfit, sans-serif'
            }}>
              ❌ {error}
            </p>
          )}
        </>
      ) : (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Outfit, sans-serif',
              color: '#1e40af'
            }}>
              ✓ Cupom aplicado: {appliedCoupon.code}
            </p>
            <p style={{
              margin: 0,
              fontSize: '13px',
              fontFamily: 'Outfit, sans-serif',
              color: '#1e40af'
            }}>
              Desconto: R$ {appliedCoupon.calculated_discount.toFixed(2)}
              {appliedCoupon.description && ` - ${appliedCoupon.description}`}
            </p>
          </div>
          <button
            onClick={handleRemoveCoupon}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '600'
            }}
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
