// Shipping Integration Route - Endpoint público para cálculo de frete
const express = require('express');
const router = express.Router();
const shippingRouter = require('../services/shippingRouter');
const { quoteForCart } = require('../services/shippingQuote');

// Limite simples em memoria: 30 cotacoes por minuto por IP (a rota e publica)
const hits = new Map();
const rateLimit = (req, res, next) => {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < 60 * 1000);
  recent.push(now);
  hits.set(req.ip, recent);
  if (hits.size > 5000) hits.clear();
  if (recent.length > 30) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  next();
};

// POST /api/shipping/calculate
// Calcula opções de frete baseado no país e CEP de destino
// Body: { country, zipCode, weight, dimensions: { width, height, length } }
router.post('/calculate', rateLimit, async (req, res) => {
  try {
    const { country, zipCode, weight, dimensions, items } = req.body;

    // Novo formato: o servidor le peso e medidas dos produtos no banco
    if (Array.isArray(items)) {
      if (!country || !zipCode) {
        return res.status(400).json({ error: 'Missing required fields: country, zipCode, items' });
      }
      const options = await quoteForCart({ items, zipCode, country });
      return res.json({ country, zipCode, options: options || [], timestamp: new Date() });
    }

    // Formato antigo (peso informado pelo cliente)
    if (!country || !zipCode || !weight) {
      return res.status(400).json({
        error: 'Missing required fields: country, zipCode, weight',
      });
    }

    if (weight <= 0) {
      return res.status(400).json({
        error: 'Weight must be greater than 0',
      });
    }

    // Calcular opções de frete
    const options = await shippingRouter.calculateShippingByCountry(
      country.toUpperCase(),
      zipCode,
      parseFloat(weight),
      dimensions || {}
    );

    res.json({
      country,
      zipCode,
      weight,
      options: options || [],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Shipping calculation error:', error.message);
    res.status(error.status || 400).json({
      error: error.message || 'Failed to calculate shipping',
      code: error.code,
      specialProducts: error.specialProducts,
    });
  }
});

// GET /api/shipping/supported-countries
// Retorna lista de países suportados
router.get('/supported-countries', (req, res) => {
  const supported = shippingRouter.getSupportedCountries();
  res.json(supported);
});

// GET /api/shipping/health
// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    services: ['melhor-envio (BR)', 'easypost (EU)'],
  });
});

module.exports = router;
