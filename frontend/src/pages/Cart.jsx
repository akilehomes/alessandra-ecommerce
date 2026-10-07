import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import axios from 'axios';
import ShippingCalculator from '../components/ShippingCalculator';
import { useCouponStore, computeDiscount } from '../store/couponStore';
import { useI18n } from '../i18n';
import { currencyOfRegion, unitPriceFor } from '../utils/pricing';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const REGION_CONFIG = {
  BR: { name: 'Brasil', symbol: 'R$', tax: 0.18 },
  PT: { name: 'Portugal', symbol: '€', tax: 0.23 },
  EU: { name: 'Europa', symbol: '€', tax: 0.21 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, syncStock } = useCartStore();
  const { t, money } = useI18n();

  // Ao abrir o carrinho, confere estoque e disponibilidade atuais de cada item
  useEffect(() => { syncStock(); }, [syncStock, items.length]);
  const { appliedCoupon, applyCoupon, removeCoupon } = useCouponStore();
  const { region } = useRegionStore();
  const regionConfig = REGION_CONFIG[region];
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [couponLoading, setCouponLoading] = useState(false);
  // Moeda da regiao; em euro, usa o preco em euro de cada item (sem preco em euro = nao vendido la)
  const currency = currencyOfRegion(region);
  const lineUnit = (item) => unitPriceFor(item, currency);
  const unavailable = items.some((i) => lineUnit(i) === null);
  const total = items.reduce((sum, i) => sum + (lineUnit(i) || 0) * i.quantity, 0);
  // Cupom so vale em reais (valores fixos sao em R$)
  const discount = currency === 'BRL' ? computeDiscount(appliedCoupon, total) : 0;
  const [specialShipping, setSpecialShipping] = useState(false); // ha item sem frete automatico
  const [shipping, setShipping] = useState(null); // opcao de frete escolhida (somente Brasil)

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await axios.post(`${API_URL}/coupons/validate`, { code, subtotal: total });
      applyCoupon(response.data);
      setCouponCode('');
      setCouponMessage({ type: 'ok', text: t('cart.couponOk') });
    } catch (error) {
      const reasons = {
        'Invalid coupon code': t('cart.couponInvalid'),
        'Coupon has expired': t('cart.couponExpired'),
        'Coupon usage limit reached': t('cart.couponLimit'),
      };
      const apiMessage = error.response?.data?.error;
      setCouponMessage({ type: 'error', text: reasons[apiMessage] || t('cart.couponFail') });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage(null);
  };

  if (items.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-24 px-6 text-center">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('cart.title')}
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', marginBottom: '32px', color: '#666'}}>
            {t('cart.empty')}
          </p>
          <button
            onClick={() => navigate('/shop')}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '10px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            {t('common.continueShopping')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-24 px-6">
        <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '32px', textTransform: 'uppercase'}}>
          {t('cart.title')}
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
                    {lineUnit(item) === null ? t('product.unavailableRegion') : money(lineUnit(item), currency)}
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
                        disabled={item.stock != null && item.quantity >= item.stock}
                        style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px 12px', border: 'none', background: 'none', cursor: item.stock != null && item.quantity >= item.stock ? 'not-allowed' : 'pointer', opacity: item.stock != null && item.quantity >= item.stock ? 0.3 : 1}}
                      >
                        +
                      </button>
                    </div>
                    {item.stock != null && item.quantity >= item.stock && (
                      <span style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#d97706'}}>
                        {t('cart.max', { n: item.stock })}
                      </span>
                    )}

                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', cursor: 'pointer', textDecoration: 'underline'}}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>

                <div style={{textAlign: 'right'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700'}}>
                    {lineUnit(item) === null ? '—' : money(lineUnit(item) * item.quantity, currency)}
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
                items={items.map((item) => ({ productId: item.productId, quantity: item.quantity, name: item.name }))}
                onSelect={setShipping}
                onSpecial={setSpecialShipping}
              />
            )}
          </div>

          {/* Summary */}
          <div>
            <div style={{border: '1px solid #000', padding: '24px'}}>
              <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase'}}>
                {t('cart.summary')}
              </h2>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', marginBottom: '16px', textTransform: 'uppercase'}}>
                {t('cart.regionNote', { currency })}
              </p>

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px'}}>
                <span>{t('cart.subtotal')}</span>
                <span>{money(total, currency)}</span>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#d97706'}}>
                <span>{t('cart.tax', { rate: Math.round(regionConfig.tax * 100) })}</span>
                <span>{money(total * regionConfig.tax, currency)}</span>
              </div>

              {discount > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#10b981'}}>
                  <span>{t('cart.discount', { code: appliedCoupon?.code })}</span>
                  <span>-{money(discount, currency)}</span>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px'}}>
                <span>{t('cart.shipping')}</span>
                <span>
                  {shipping ? money(Number(shipping.price), currency) : (region === 'BR' ? t('cart.enterZip') : t('cart.atCheckout'))}
                </span>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #000', marginBottom: '20px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700'}}>
                <span>{t('cart.total')}</span>
                <span>{money(total + (total * regionConfig.tax) - discount + (shipping ? Number(shipping.price) : 0), currency)}</span>
              </div>

              {/* Coupon (apenas em reais) */}
              {currency === 'BRL' && (
              <div style={{marginBottom: '16px'}}>
                {appliedCoupon ? (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '10px 12px', background: '#f3f3f3'}}>
                    <span>{t('cart.couponApplied', { code: appliedCoupon.code })}</span>
                    <button
                      onClick={handleRemoveCoupon}
                      style={{background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px'}}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder={t('cart.couponPh')}
                      aria-label={t('cart.couponPh')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', width: '100%', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', marginBottom: '12px', background: 'transparent'}}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', padding: '8px', width: '100%', border: '1px solid #000', background: '#fff', color: '#000', cursor: couponLoading ? 'wait' : 'pointer', textTransform: 'uppercase', opacity: couponLoading ? 0.6 : 1}}
                    >
                      {couponLoading ? t('cart.verifying') : t('cart.apply')}
                    </button>
                  </>
                )}
                {couponMessage && (
                  <p role="status" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', margin: '8px 0 0', color: couponMessage.type === 'error' ? '#b00020' : '#2a6b2a'}}>
                    {couponMessage.text}
                  </p>
                )}
              </div>
              )}

              <button
                onClick={() => navigate('/checkout')}
                disabled={specialShipping || unavailable}
                style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px', width: '100%', border: '1px solid #000', background: '#000', color: '#fff', cursor: specialShipping ? 'not-allowed' : 'pointer', textTransform: 'uppercase', marginBottom: specialShipping ? '8px' : '12px', opacity: specialShipping ? 0.45 : 1}}
              >
                {t('cart.checkout')}
              </button>
              {specialShipping && (
                <p role="status" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#666', margin: '0 0 12px'}}>
                  {t('cart.specialNote')}
                </p>
              )}
              {unavailable && (
                <p role="status" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#b91c1c', margin: '0 0 12px'}}>
                  {t('cart.unavailable')}
                </p>
              )}

              <button
                onClick={() => navigate('/shop')}
                style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px', width: '100%', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer', textTransform: 'uppercase'}}
              >
                {t('common.continueShopping')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
