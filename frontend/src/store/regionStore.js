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

// Regiao escolhida fica salva no navegador; sem escolha, o padrao e Brasil
const savedRegion = (() => {
  try {
    const r = localStorage.getItem('region');
    return REGIONS[r] ? r : 'BR';
  } catch (e) {
    return 'BR';
  }
})();

export const useRegionStore = create((set) => ({
  region: savedRegion,
  exchangeRate: 1.0, // BRL to EUR rate (will update dynamically)

  setRegion: (region) => {
    try { localStorage.setItem('region', region); } catch (e) { /* ignora */ }
    set({ region });
    // Fetch exchange rate when switching to EUR region
    if (region === 'PT' || region === 'EU') {
      // Simular taxa de câmbio: 1 EUR = 5.2 BRL
      set({ exchangeRate: 5.2 });
    } else {
      set({ exchangeRate: 1.0 });
    }
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
