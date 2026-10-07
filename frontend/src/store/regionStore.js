import { create } from 'zustand';

const REGIONS = {
  BR: {
    name: 'Brasil',
    currency: 'BRL',
    symbol: 'R$',
    tax: 0.18,
  },
  PT: {
    name: 'Portugal',
    currency: 'EUR',
    symbol: '€',
    tax: 0.23,
  },
  EU: {
    name: 'Europa',
    currency: 'EUR',
    symbol: '€',
    tax: 0.21,
  },
};

// Paises da Uniao Europeia atendidos (o resto do mundo ainda nao); Portugal e Brasil tem regiao propria
const EU_CODES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
const regionOfCountry = (code) => (code === 'BR' ? 'BR' : code === 'PT' ? 'PT' : 'EU');

// Pais escolhido fica salvo no navegador. Sem escolha, tenta o pais do idioma do navegador (ex.: pt-PT -> Portugal); senao, Brasil
const initialCountry = (() => {
  try {
    const saved = localStorage.getItem('country');
    if (saved && (saved === 'BR' || EU_CODES.includes(saved))) return saved;
    const tag = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toUpperCase();
    const guess = tag.split('-')[1];
    if (guess && (guess === 'BR' || EU_CODES.includes(guess))) return guess;
    // compatibilidade com a escolha antiga (so regiao)
    const r = localStorage.getItem('region');
    if (r === 'PT') return 'PT';
    if (r === 'EU') return 'ES';
  } catch (e) { /* sem armazenamento */ }
  return 'BR';
})();

export const useRegionStore = create((set) => ({
  country: initialCountry,
  region: regionOfCountry(initialCountry), // define moeda e precos: BR=reais; PT/EU=euros
  exchangeRate: 1.0, // BRL to EUR rate (will update dynamically)

  // Escolher o pais define tambem a regiao (moeda e precos)
  setCountry: (country) => {
    const region = regionOfCountry(country);
    try { localStorage.setItem('country', country); localStorage.setItem('region', region); } catch (e) { /* ignora */ }
    set({ country, region });
  },

  setRegion: (region) => {
    const country = region === 'BR' ? 'BR' : region === 'PT' ? 'PT' : 'ES';
    try { localStorage.setItem('country', country); localStorage.setItem('region', region); } catch (e) { /* ignora */ }
    set({ region, country });
  },

  getRegionConfig: (region) => REGIONS[region] || REGIONS.BR,

  formatPrice: (amount, targetRegion = null) => {
    const reg = targetRegion || useRegionStore.getState().region;
    const config = REGIONS[reg];

    if (reg === 'BR') {
      return `${config.symbol} ${amount.toFixed(2).replace('.', ',')}`;
    } else {
      return `${config.symbol} ${amount.toFixed(2)}`;
    }
  },
}));
