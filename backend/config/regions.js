// Configuração de Regiões e Moedas

const REGIONS = {
  BR: {
    name: 'Brasil',
    currency: 'BRL',
    currencySymbol: 'R$',
    locale: 'pt-BR',
    tax: 0.18, // 18% ICMS médio
    paymentMethods: ['pix', 'boleto', 'card'],
    shippingProviders: ['correios', 'loggi', 'sedex'],
    defaultShippingDays: {
      pix: 10,
      boleto: 15,
      card: 10,
    },
  },
  PT: {
    name: 'Portugal',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'pt-PT',
    tax: 0.23, // 23% IVA
    paymentMethods: ['card', 'sepa', 'paypal'],
    shippingProviders: ['ctm', 'gls', 'dhl'],
    defaultShippingDays: {
      card: 5,
      sepa: 7,
      paypal: 5,
    },
  },
  EU: {
    name: 'Europa',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'en-EU',
    tax: 0.21, // Média UE
    paymentMethods: ['card', 'sepa', 'paypal', 'klarna'],
    shippingProviders: ['dhl', 'ups', 'fedex'],
    defaultShippingDays: {
      card: 7,
      sepa: 10,
      paypal: 7,
    },
  },
};

const PAYMENT_GATEWAYS = {
  BR: {
    pix: { provider: 'mercadopago', fee: 0.0 },
    boleto: { provider: 'mercadopago', fee: 0.02 },
    card: { provider: 'stripe', fee: 0.029 + 0.30 },
  },
  PT: {
    card: { provider: 'stripe', fee: 0.029 + 0.30 },
    sepa: { provider: 'stripe', fee: 0.01 },
    paypal: { provider: 'paypal', fee: 0.034 + 0.30 },
  },
  EU: {
    card: { provider: 'stripe', fee: 0.029 + 0.30 },
    sepa: { provider: 'stripe', fee: 0.01 },
    paypal: { provider: 'paypal', fee: 0.034 + 0.30 },
    klarna: { provider: 'klarna', fee: 0.05 },
  },
};

const SHIPPING_ZONES = {
  BR_TO_WORLD: {
    from: 'BR',
    carriers: [
      { name: 'SEDEX Internacional', maxDays: 15, basePrice: 150 },
      { name: 'PAC Internacional', maxDays: 30, basePrice: 80 },
      { name: 'DHL Express', maxDays: 3, basePrice: 300 },
    ],
  },
  PT_TO_EU: {
    from: 'PT',
    carriers: [
      { name: 'CTT Internacional', maxDays: 5, basePrice: 25 },
      { name: 'DHL EU', maxDays: 2, basePrice: 50 },
      { name: 'GLS', maxDays: 5, basePrice: 20 },
    ],
  },
  PT_TO_WORLD: {
    from: 'PT',
    carriers: [
      { name: 'DHL Express', maxDays: 3, basePrice: 100 },
      { name: 'UPS', maxDays: 7, basePrice: 80 },
      { name: 'DPD World', maxDays: 10, basePrice: 60 },
    ],
  },
};

module.exports = { REGIONS, PAYMENT_GATEWAYS, SHIPPING_ZONES };
