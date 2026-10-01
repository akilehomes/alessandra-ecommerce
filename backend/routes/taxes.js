const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// GET /api/taxes/rate/:country - Get tax rate for a country
router.get('/rate/:country', async (req, res) => {
  try {
    const { country } = req.params;

    const result = await pool.query(
      `SELECT id, country, tax_rate, tax_type 
       FROM tax_rates 
       WHERE country = $1 AND active = true`,
      [country.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tax rate not found for this country' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get tax rate error:', error);
    res.status(500).json({ error: 'Failed to fetch tax rate' });
  }
});

// POST /api/taxes/calculate - Calculate tax for amount
router.post('/calculate', async (req, res) => {
  try {
    const { amount, country } = req.body;

    if (!amount || !country) {
      return res.status(400).json({ error: 'amount and country are required' });
    }

    const result = await pool.query(
      `SELECT tax_rate FROM tax_rates 
       WHERE country = $1 AND active = true`,
      [country.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tax rate not found' });
    }

    const taxRate = result.rows[0].tax_rate;
    const taxAmount = (amount * taxRate) / 100;

    res.json({
      country,
      amount,
      taxRate: parseFloat(taxRate),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat((amount + taxAmount).toFixed(2)),
    });
  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ error: 'Tax calculation failed' });
  }
});

// GET /api/taxes/rates - Get all tax rates
router.get('/rates', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT country, region, tax_rate, tax_type 
       FROM tax_rates 
       WHERE active = true 
       ORDER BY country ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get tax rates error:', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

module.exports = router;
