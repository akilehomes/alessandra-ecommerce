const express = require('express');
const router = express.Router();
const { app, pool } = require('../server');

// POST email notification (quando produto volta ao estoque)
router.post('/stock-notification', async (req, res) => {
  try {
    const { productId } = req.body;

    // Get pending notifications
    const result = await pool.query(
      'SELECT * FROM stock_reservations WHERE product_id = $1 AND status = $2',
      [productId, 'active']
    );

    // TODO: Send email to each user using SendGrid

    res.json({ notified: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
