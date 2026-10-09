import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Paises atendidos e regras de endereco/documento: vem do servidor (uma unica fonte de verdade)
let cache = null;
let inflight = null;

export function loadCountries() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = axios.get(`${API_URL}/geo/countries`)
      .then((r) => { cache = r.data; return cache; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}


// Fallback de paises se o backend nao responder
const FALLBACK_COUNTRIES = [
  { code: 'BR', name: 'Brasil', region: 'BR', currency: 'BRL' },
  { code: 'PT', name: 'Portugal', region: 'PT', currency: 'EUR' },
  { code: 'ES', name: 'Espanha', region: 'EU', currency: 'EUR' },
  { code: 'FR', name: 'França', region: 'EU', currency: 'EUR' },
  { code: 'IT', name: 'Itália', region: 'EU', currency: 'EUR' },
  { code: 'DE', name: 'Alemanha', region: 'EU', currency: 'EUR' },
  { code: 'UK', name: 'Reino Unido', region: 'EU', currency: 'GBP' },
  { code: 'US', name: 'Estados Unidos', region: 'US', currency: 'USD' },
];

export function useCountries() {
  const [countries, setCountries] = useState(cache || []);
  useEffect(() => {
    if (!cache) loadCountries().then(setCountries).catch(() => setCountries(FALLBACK_COUNTRIES));
  }, []);
  return countries;
}

export const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

export const maskCep = (v) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const maskCpf = (v) => {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
};

export const maskCnpj = (v) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// Preenche rua, bairro, cidade e estado a partir do CEP (ViaCEP, servico publico dos Correios)
export async function lookupCep(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;
  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${digits}/json/`, { timeout: 5000 });
    if (!data || data.erro) return null;
    return { street: data.logradouro || '', district: data.bairro || '', city: data.localidade || '', state: data.uf || '' };
  } catch (e) {
    return null;
  }
}

export const emptyAddress = (country = 'BR') => ({
  recipient_name: '', phone: '', country,
  postal_code: '', street: '', number: '', complement: '', district: '', city: '', state: '',
});

// Uma linha legivel: "Av Paulista, 1000 - Bela Vista, Sao Paulo/SP, 01310-100, Brasil"
export function formatAddress(a, countries = [], countryName) {
  if (!a) return '';
  const country = countryName ? countryName(a.country) : ((countries.find((c) => c.code === a.country) || {}).name || a.country || '');
  const first = [a.street, a.number].filter(Boolean).join(', ');
  const second = [a.complement, a.district].filter(Boolean).join(' - ');
  const cityState = [a.city, a.state].filter(Boolean).join(a.country === 'BR' ? '/' : ', ');
  const postal = a.country === 'BR' ? maskCep(a.postal_code || a.cep) : (a.postal_code || a.cep);
  // Fora do Brasil o codigo postal vem antes da cidade (75001 Paris, 1000-001 Lisboa)
  if (a.country === 'BR') return [first, second, cityState, postal, country].filter(Boolean).join(' · ');
  return [first, second, [postal, a.city].filter(Boolean).join(' '), a.state, country].filter(Boolean).join(' · ');
}
