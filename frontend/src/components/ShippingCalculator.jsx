import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useI18n } from '../i18n';
import SpecialShippingRequest from './SpecialShippingRequest';
import './ShippingCalculator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const STORAGE_KEY = 'shippingCep';

const formatCep = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

// Evita repetir o nome ("PAC PAC") quando transportadora e servico coincidem
const optionLabel = (option) => {
  const carrier = option.carrier || '';
  const service = option.service || '';
  if (!carrier || !service) return service || carrier;
  // "Loggi" + "Loggi Express" -> "Loggi Express"
  if (service.toLowerCase().startsWith(carrier.toLowerCase())) return service;
  return `${carrier} ${service}`;
};

const readSavedCep = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
};

const cheapest = (options) => options.reduce((best, o) => (best === null || o.price < best.price ? o : best), null);

// Calculadora de frete e prazo (somente Brasil). Usada na pagina do produto e no carrinho.
//   items: [{ productId, quantity }]
//   selectable: lista as opcoes como escolha; onSelect(opcao | null) avisa a pagina
//   autoCalculate: calcula sozinha ao abrir se ja houver um CEP salvo
export default function ShippingCalculator({
  items,
  symbol = 'R$',
  selectable = false,
  onSelect,
  autoCalculate = false,
  bare = false,
  onSpecial,
}) {
  const { t, money } = useI18n();
  const currencyCode = symbol === '€' ? 'EUR' : 'BRL';
  const [cep, setCep] = useState(readSavedCep);
  const [result, setResult] = useState(null); // { options, cep }
  const [selectedId, setSelectedId] = useState(null);
  const [special, setSpecial] = useState(null); // { products: [ids] } quando nao ha frete automatico
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const lastCep = useRef('');
  const onSpecialRef = useRef(onSpecial);
  onSpecialRef.current = onSpecial;

  const markSpecial = useCallback((value) => {
    setSpecial(value);
    if (onSpecialRef.current) onSpecialRef.current(!!value);
  }, []);
  const selectedIdRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const itemsKey = JSON.stringify((items || []).map((i) => [i.productId, i.quantity]));
  const totalUnits = (items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const choose = useCallback((option) => {
    selectedIdRef.current = option ? option.id : null;
    setSelectedId(option ? option.id : null);
    if (onSelectRef.current) onSelectRef.current(option);
  }, []);

  const calculate = useCallback(async (cepValue) => {
    const digits = cepValue.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError(t('ship.zipInvalid'));
      return;
    }
    if (!items || items.length === 0) return;

    const current = ++requestId.current;
    lastCep.current = formatCep(digits);
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/shipping-integration/calculate`, {
        country: 'BR',
        zipCode: digits,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (current !== requestId.current) return; // resposta antiga
      markSpecial(null);
      const options = [...(response.data.options || [])].sort((a, b) => a.price - b.price);
      if (options.length === 0) {
        setResult(null);
        choose(null);
        setError(t('ship.noOptionsZip'));
        return;
      }
      setResult({ options, cep: formatCep(digits) });
      if (selectable) {
        // mantem a opcao escolhida se ela ainda existe; senao, a mais barata
        choose(options.find((o) => o.id === selectedIdRef.current) || cheapest(options));
      }
      try {
        localStorage.setItem(STORAGE_KEY, formatCep(digits));
      } catch (e) {
        /* sem armazenamento: segue sem lembrar o CEP */
      }
    } catch (err) {
      if (current !== requestId.current) return;
      setResult(null);
      choose(null);
      if (err.response?.data?.code === 'NO_SHIPPING_OPTIONS') {
        markSpecial({ products: err.response.data.specialProducts || [] });
        return;
      }
      markSpecial(null);
      setError(
        err.response?.status === 429
          ? t('ship.tooMany')
          : t('ship.failed')
      );
    } finally {
      if (current === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, selectable, choose, markSpecial]);

  // Calcula sozinha ao abrir, se pedido e se ja houver CEP salvo
  useEffect(() => {
    if (autoCalculate && cep.replace(/\D/g, '').length === 8) calculate(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se os itens ou as quantidades mudam depois de calcular, recalcula sozinha
  useEffect(() => {
    if (!result && !special) return undefined;
    const timer = setTimeout(() => calculate(result ? result.cep : lastCep.current), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    calculate(cep);
  };

  return (
    <section className={`psc${bare ? ' psc--bare' : ''}`} aria-labelledby="psc-title">
      <h3 id="psc-title" className="psc-title">{t('ship.title')}</h3>

      <form className="psc-form" onSubmit={handleSubmit}>
        <label htmlFor="psc-cep" className="psc-visually-hidden">{t('ship.zipLabel')}</label>
        <input
          id="psc-cep"
          className="psc-input"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder={t('ship.zipPh')}
          value={cep}
          maxLength={9}
          onChange={(e) => setCep(formatCep(e.target.value))}
        />
        <button type="submit" className="psc-button" disabled={loading}>
          {loading ? t('ship.calculating') : t('ship.calc')}
        </button>
      </form>

      <a
        className="psc-link"
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('ship.dontKnowZip')}
      </a>

      <div aria-live="polite">
        {error && <p className="psc-error">{error}</p>}

        {special && (
          <div className="psc-special">
            <strong>{t('ship.specialTitle')}</strong>
            {t('ship.specialText')}
            {(() => {
              const names = items.filter((i) => special.products.includes(i.productId)).map((i) => i.name).filter(Boolean);
              return names.length > 0 ? <div className="psc-special-items">{t('ship.specialItem', { names: names.join(', ') })}</div> : <div className="psc-special-items" />;
            })()}
            <SpecialShippingRequest items={items} specialProducts={special.products} cep={lastCep.current} />
          </div>
        )}

        {result && (
          <div className="psc-result">
            <p className="psc-summary">
              {t('ship.deliveryTo', { zip: result.cep, units: totalUnits === 1 ? t('ship.unit.one', { n: 1 }) : t('ship.unit.other', { n: totalUnits }) })}
            </p>
            <ul className="psc-list" role={selectable ? 'radiogroup' : undefined} aria-label={t('ship.optionsLabel')}>
              {result.options.map((option) => {
                const label = optionLabel(option);
                const days = option.delivery_time > 0
                  ? (option.delivery_time === 1 ? t('ship.day.one', { n: 1 }) : t('ship.day.other', { n: option.delivery_time }))
                  : null;
                const content = (
                  <>
                    <div>
                      <span className="psc-carrier">{label}</span>
                      {days && <span className="psc-days"> · {days}</span>}
                    </div>
                    <strong className="psc-price">{money(Number(option.price), currencyCode)}</strong>
                  </>
                );
                return selectable ? (
                  <li key={option.id} className="psc-li">
                    <label className={`psc-option psc-option--choice${selectedId === option.id ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="shipping-option"
                        className="psc-radio"
                        checked={selectedId === option.id}
                        onChange={() => choose(option)}
                      />
                      <span className="psc-option-body">{content}</span>
                    </label>
                  </li>
                ) : (
                  <li key={option.id} className="psc-option">{content}</li>
                );
              })}
            </ul>
            <p className="psc-note">
              {selectable
                ? t('ship.noteSelectable')
                : t('ship.noteProduct')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
