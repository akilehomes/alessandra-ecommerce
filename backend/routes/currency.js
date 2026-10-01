const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// GET /api/currency/rate - Get exchange rate
router.get('/rate', async (req, res) => {
  try {
    const { from = 'BRL', to = 'EUR' } = req.query;

    const result = await pool.query(
      `SELECT rate FROM currency_rates 
       WHERE from_currency = $1 AND to_currency = $2`,
      [from.toUpperCase(), to.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Currency pair not found' });
    }

    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: parseFloat(result.rows[0].rate),
    });
  } catch (error) {
    console.error('Get rate error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// POST /api/currency/convert - Convert amount from one currency to another
router.post('/convert', async (req, res) => {
  try {
    const { amount, from = 'BRL', to = 'EUR' } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const result = await pool.query(
      `SELECT rate FROM currency_rates 
       WHERE from_currency = $1 AND to_currency = $2`,
      [from.toUpperCase(), to.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Currency pair not found' });
    }

    const rate = parseFloat(result.rows[0].rate);
    const convertedAmount = amount * rate;

    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      rate,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    });
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Currency conversion failed' });
  }
});

// GET /api/currency/all - Get all currency rates
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT from_currency, to_currency, rate, last_updated 
       FROM currency_rates 
       ORDER BY from_currency, to_currency ASC`
    );

    const rates = {};
    result.rows.forEach((row) => {
      if (!rates[row.from_currency]) {
        rates[row.from_currency] = {};
      }
      rates[row.from_currency][row.to_currency] = parseFloat(row.rate);
    });

    res.json(rates);
  } catch (error) {
    console.error('Get all rates error:', error);
    res.status(500).json({ error: 'Failed to fetch currency rates' });
  }
});

// PUT /api/currency/update-rate - Update exchange rate (admin only)
router.put('/update-rate', async (req, res) => {
  try {
    const { from, to, rate } = req.body;

    if (!from || !to || !rate) {
      return res.status(400).json({ error: 'from, to, and rate are required' });
    }

    const result = await pool.query(
      `UPDATE currency_rates 
       SET rate = $1, last_updated = NOW() 
       WHERE from_currency = $2 AND to_currency = $3 
       RETURNING *`,
      [parseFloat(rate), from.toUpperCase(), to.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Currency pair not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

module.exports = router;
