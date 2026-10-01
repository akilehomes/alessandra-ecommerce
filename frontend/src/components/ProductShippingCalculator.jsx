import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './ProductShippingCalculator.css';

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
  if (!carrier || !service || carrier.toLowerCase() === service.toLowerCase()) return service || carrier;
  return `${carrier} ${service}`;
};

const readSavedCep = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
};

// Calculadora de frete e prazo na pagina do produto (somente Brasil)
export default function ProductShippingCalculator({ productId, quantity, symbol = 'R$' }) {
  const [cep, setCep] = useState(readSavedCep);
  const [result, setResult] = useState(null); // { options, cep }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const calculate = useCallback(async (cepValue) => {
    const digits = cepValue.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError('Informe um CEP com 8 números.');
      return;
    }

    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/shipping-integration/calculate`, {
        country: 'BR',
        zipCode: digits,
        items: [{ productId, quantity }],
      });
      if (current !== requestId.current) return; // resposta antiga
      const options = [...(response.data.options || [])].sort((a, b) => a.price - b.price);
      if (options.length === 0) {
        setResult(null);
        setError('Não encontramos opções de entrega para este CEP.');
        return;
      }
      setResult({ options, cep: formatCep(digits) });
      try {
        localStorage.setItem(STORAGE_KEY, formatCep(digits));
      } catch (e) {
        /* sem armazenamento: segue sem lembrar o CEP */
      }
    } catch (err) {
      if (current !== requestId.current) return;
      setResult(null);
      setError(
        err.response?.status === 429
          ? 'Muitas consultas seguidas. Aguarde um instante e tente de novo.'
          : 'Não foi possível calcular o frete agora. Tente novamente.'
      );
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [productId, quantity]);

  // Se o cliente muda a quantidade depois de calcular, recalcula sozinho
  useEffect(() => {
    if (!result) return undefined;
    const timer = setTimeout(() => calculate(result.cep), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, productId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    calculate(cep);
  };

  return (
    <section className="psc" aria-labelledby="psc-title">
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
              Entrega para {result.cep} · {quantity} {quantity === 1 ? 'unidade' : 'unidades'}
            </p>
            <ul className="psc-list">
              {result.options.map((option) => (
                <li key={option.id} className="psc-option">
                  <div>
                    <span className="psc-carrier">{optionLabel(option)}</span>
                    {option.delivery_time > 0 && (
                      <span className="psc-days">
                        {' '}· {option.delivery_time} {option.delivery_time === 1 ? 'dia útil' : 'dias úteis'}
                      </span>
                    )}
                  </div>
                  <strong className="psc-price">{symbol} {Number(option.price).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
            <p className="psc-note">
              Valores para este produto. No carrinho, o frete considera todos os itens e pode variar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
