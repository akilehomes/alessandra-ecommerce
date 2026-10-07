import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import './AddedToCartModal.css';

// Janela exibida depois de adicionar um produto ao carrinho
export default function AddedToCartModal({ item, symbol = 'R$', onContinue, onGoToCart }) {
  const { t, money } = useI18n();
  const primaryRef = useRef(null);

  useEffect(() => {
    if (!item) return undefined;
    primaryRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onContinue();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onContinue]);

  if (!item) return null;

  const unitPrice = Number(item.price) || 0;

  return (
    <div className="atc-overlay" onClick={onContinue}>
      <div
        className="atc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="atc-close" onClick={onContinue} aria-label="Fechar">
          ×
        </button>

        <p className="atc-eyebrow">
          <span className="atc-check" aria-hidden="true">✓</span>
          <span id="atc-title">{t('product.addedTitle')}</span>
        </p>

        <div className="atc-item">
          {item.image_url && <img className="atc-thumb" src={item.image_url} alt="" />}
          <div className="atc-info">
            <p className="atc-name">{item.name}</p>
            <p className="atc-meta">
              {t('product.qty')}: {item.quantity}
              {unitPrice > 0 && <> · {money(unitPrice * item.quantity, symbol === '€' ? 'EUR' : 'BRL')}</>}
            </p>
          </div>
        </div>

        <div className="atc-actions">
          <button type="button" className="atc-btn atc-btn-primary" ref={primaryRef} onClick={onGoToCart}>
            {t('product.goToCart')}
          </button>
          <button type="button" className="atc-btn atc-btn-secondary" onClick={onContinue}>
            {t('product.keepShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}
