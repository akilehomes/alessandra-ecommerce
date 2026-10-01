// Cotacao de frete a partir do carrinho. O servidor le peso, medidas e preco do BANCO;
// do cliente so vem produto e quantidade.
const { Pool } = require('pg');
const melhorEnvio = require('./melhorEnvioService');
const shippingRouter = require('./shippingRouter');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Usados quando o produto ainda nao tem peso/medidas cadastrados no admin
const DEFAULT_WEIGHT = 1; // kg
const DEFAULT_DIMENSIONS = { width: 20, height: 20, length: 30 }; // cm (profundidade = comprimento)

async function loadCartProducts(items) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const result = await pool.query(
    'SELECT id, name, price, weight, width, height, depth FROM products WHERE id = ANY($1::uuid[])',
    [ids]
  );
  const byId = new Map(result.rows.map((p) => [p.id, p]));
  if (byId.size !== ids.length) {
    const err = new Error('One or more products are unavailable');
    err.status = 400;
    throw err;
  }

  return items.map((item) => {
    const p = byId.get(item.productId);
    const missing = !(Number(p.weight) > 0) || !(Number(p.width) > 0) || !(Number(p.height) > 0) || !(Number(p.depth) > 0);
    if (missing) console.warn(`⚠️ Produto "${p.name}" sem peso/medidas completos: usando padrao no frete`);
    return {
      id: p.id,
      weight: Number(p.weight) > 0 ? Number(p.weight) : DEFAULT_WEIGHT,
      width: Number(p.width) > 0 ? Number(p.width) : DEFAULT_DIMENSIONS.width,
      height: Number(p.height) > 0 ? Number(p.height) : DEFAULT_DIMENSIONS.height,
      length: Number(p.depth) > 0 ? Number(p.depth) : DEFAULT_DIMENSIONS.length,
      insurance_value: Number(p.price) || 0, // valor declarado por unidade
      quantity: item.quantity,
    };
  });
}

// items: [{ productId, quantity }]
async function quoteForCart({ items, zipCode, country = 'BR' }) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Cart items are required');
    err.status = 400;
    throw err;
  }
  const clean = items.map((i) => ({ productId: i.productId, quantity: Math.floor(Number(i.quantity)) }));
  if (clean.some((i) => !i.productId || !Number.isFinite(i.quantity) || i.quantity < 1 || i.quantity > 100)) {
    const err = new Error('Invalid cart items');
    err.status = 400;
    throw err;
  }

  let products;
  try {
    products = await loadCartProducts(clean);
  } catch (e) {
    if (e.status) throw e;
    const err = new Error('Invalid cart items');
    err.status = 400;
    throw err;
  }

  if (country.toUpperCase() === 'BR') {
    return melhorEnvio.calculateShippingForProducts(zipCode, products);
  }

  // Outros paises: servico existente, com peso total e a maior caixa
  const totalWeight = products.reduce((sum, p) => sum + p.weight * p.quantity, 0);
  return shippingRouter.calculateShippingByCountry(country.toUpperCase(), zipCode, totalWeight, DEFAULT_DIMENSIONS);
}

module.exports = { quoteForCart };
