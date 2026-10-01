const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const axios = require('axios');
const { pool } = require('../server');

// POST /api/shipping/calculate - Calculate shipping cost
router.post('/calculate', async (req, res) => {
  try {
    const { destination, weight = 1, items = [], region = 'BR' } = req.body;

    if (!destination || !region) {
      return res.status(400).json({ error: 'destination and region are required' });
    }

    // Get total weight from items or use provided weight
    let totalWeight = weight;
    if (items && items.length > 0) {
      totalWeight = items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
    }

    // Get shipping rates from database
    const shippingResult = await pool.query(
      `SELECT * FROM shipping_rates 
       WHERE active = true AND dest_region = $1 
       ORDER BY carrier ASC`,
      [region]
    );

    if (shippingResult.rows.length === 0) {
      return res.status(400).json({ error: 'No shipping options available for this region' });
    }

    const shippingOptions = shippingResult.rows.map((rate) => {
      const cost = rate.base_price + (totalWeight * rate.price_per_kg);
      return {
        id: rate.id,
        carrier: rate.carrier,
        name: `${rate.carrier} - ${rate.estimated_days} dias`,
        price: parseFloat(cost.toFixed(2)),
        estimatedDays: rate.estimated_days,
        weight: totalWeight,
      };
    });

    res.json({
      region,
      weight: totalWeight,
      destination,
      options: shippingOptions,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({ error: 'Shipping calculation failed' });
  }
});

// POST /api/shipping/validate-cep - Validate CEP and get address
router.post('/validate-cep', async (req, res) => {
  try {
    const { cep } = req.body;

    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'Invalid CEP format' });
    }

    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (response.data.erro) {
      return res.status(400).json({ error: 'CEP not found' });
    }

    res.json({
      cep: cleanCep,
      street: response.data.logradouro,
      neighborhood: response.data.bairro,
      city: response.data.localidade,
      state: response.data.uf,
      country: 'BR',
    });
  } catch (error) {
    console.error('CEP validation error:', error);
    res.status(500).json({ error: 'CEP validation failed' });
  }
});

// POST /api/shipping/validate-postal-code - Validate PT postal code
router.post('/validate-postal-code', async (req, res) => {
  try {
    const { postalCode } = req.body;

    // Portugal postal code format: XXXX-XXX
    const cleanCode = postalCode.replace(/\D/g, '');

    if (cleanCode.length !== 7) {
      return res.status(400).json({ error: 'Invalid postal code format' });
    }

    // For now, just validate format. In production, integrate with API
    res.json({
      postalCode: `${cleanCode.substring(0, 4)}-${cleanCode.substring(4)}`,
      city: 'Portugal',
      country: 'PT',
    });
  } catch (error) {
    console.error('Postal code validation error:', error);
    res.status(500).json({ error: 'Postal code validation failed' });
  }
});

// GET /api/shipping/rates/:region - Get available shipping rates for a region
router.get('/rates/:region', async (req, res) => {
  try {
    const { region } = req.params;

    const result = await pool.query(
      `SELECT id, carrier, base_price, price_per_kg, estimated_days 
       FROM shipping_rates 
       WHERE active = true AND dest_region = $1`,
      [region]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No shipping rates found for this region' });
    }

    res.json({
      region,
      rates: result.rows,
    });
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// GET /api/shipping/track/:trackingNumber - Get tracking info
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const result = await pool.query(
      'SELECT carrier, tracking_number, status, last_updated FROM shipping_tracking WHERE tracking_number = $1',
      [trackingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tracking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch tracking' });
  }
});

// POST /api/shipping/update-tracking - Update tracking status
router.post('/update-tracking', adminAuthMiddleware, async (req, res) => {
  try {
    const { trackingNumber, status, lastUpdate } = req.body;

    const result = await pool.query(
      `UPDATE shipping_tracking
       SET status = $1, last_updated = $2
       WHERE tracking_number = $3
       RETURNING *`,
      [status, lastUpdate || new Date(), trackingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tracking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

module.exports = router;
