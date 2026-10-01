import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
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
}) {
  const [cep, setCep] = useState(readSavedCep);
  const [result, setResult] = useState(null); // { options, cep }
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
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
      setError('Informe um CEP com 8 números.');
      return;
    }
    if (!items || items.length === 0) return;

    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/shipping-integration/calculate`, {
        country: 'BR',
        zipCode: digits,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (current !== requestId.current) return; // resposta antiga
      const options = [...(response.data.options || [])].sort((a, b) => a.price - b.price);
      if (options.length === 0) {
        setResult(null);
        choose(null);
        setError('Não encontramos opções de entrega para este CEP.');
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
      setError(
        err.response?.status === 429
          ? 'Muitas consultas seguidas. Aguarde um instante e tente de novo.'
          : 'Não foi possível calcular o frete agora. Tente novamente.'
      );
    } finally {
      if (current === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, selectable, choose]);

  // Calcula sozinha ao abrir, se pedido e se ja houver CEP salvo
  useEffect(() => {
    if (autoCalculate && cep.replace(/\D/g, '').length === 8) calculate(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se os itens ou as quantidades mudam depois de calcular, recalcula sozinha
  useEffect(() => {
    if (!result) return undefined;
    const timer = setTimeout(() => calculate(result.cep), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    calculate(cep);
  };

  return (
    <section className={`psc${bare ? ' psc--bare' : ''}`} aria-labelledby="psc-title">
      <h3 id="psc-title" className="psc-title">Calcular frete e prazo</h3>

      <form className="psc-form" onSubmit={handleSubmit}>
        <label htmlFor="psc-cep" className="psc-visually-hidden">CEP de entrega</label>
        <input
          id="psc-cep"
          className="psc-input"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Seu CEP (00000-000)"
          value={cep}
          maxLength={9}
          onChange={(e) => setCep(formatCep(e.target.value))}
        />
        <button type="submit" className="psc-button" disabled={loading}>
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      <a
        className="psc-link"
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
      >
        Não sei meu CEP
      </a>

      <div aria-live="polite">
        {error && <p className="psc-error">{error}</p>}

        {result && (
          <div className="psc-result">
            <p className="psc-summary">
              Entrega para {result.cep} · {totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'}
            </p>
            <ul className="psc-list" role={selectable ? 'radiogroup' : undefined} aria-label="Opções de entrega">
              {result.options.map((option) => {
                const label = optionLabel(option);
                const days = option.delivery_time > 0
                  ? `${option.delivery_time} ${option.delivery_time === 1 ? 'dia útil' : 'dias úteis'}`
                  : null;
                const content = (
                  <>
                    <div>
                      <span className="psc-carrier">{label}</span>
                      {days && <span className="psc-days"> · {days}</span>}
                    </div>
                    <strong className="psc-price">{symbol} {Number(option.price).toFixed(2)}</strong>
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
                ? 'O valor escolhido entra no total. Você poderá confirmar o frete no checkout.'
                : 'Valores para este produto. No carrinho, o frete considera todos os itens e pode variar.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
