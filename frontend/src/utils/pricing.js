// Moeda e preco por regiao: Brasil vende em reais; Portugal e Europa em euros (preco proprio em price_eur)
export const currencyOfRegion = (region) => (region === 'BR' ? 'BRL' : 'EUR');

// Preco unitario do produto/item na moeda pedida; null = nao vendido nessa moeda
export const unitPriceFor = (item, currency) => {
  if (currency === 'EUR') return item && item.price_eur != null ? Number(item.price_eur) : null;
  const v = Number(item && item.price);
  return Number.isFinite(v) ? v : null;
};
