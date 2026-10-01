const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// POST /api/coupons/validate - Validate coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const result = await pool.query(
      `SELECT id, code, discount_percentage, discount_amount, max_uses, used_count, 
              expires_at, active, description
       FROM coupons 
       WHERE code = $1 AND active = true`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const coupon = result.rows[0];

    // Check if expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check if max uses reached
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_percentage) {
      discountAmount = (parseFloat(subtotal) * coupon.discount_percentage) / 100;
    } else if (coupon.discount_amount) {
      discountAmount = Math.min(parseFloat(coupon.discount_amount), parseFloat(subtotal));
    }

    res.json({
      id: coupon.id,
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      discount_amount: coupon.discount_amount,
      calculated_discount: parseFloat(discountAmount.toFixed(2)),
      description: coupon.description,
      message: 'Coupon applied successfully!'
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// POST /api/coupons/use - Mark coupon as used
router.post('/use', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const result = await pool.query(
      `UPDATE coupons 
       SET used_count = used_count + 1, updated_at = NOW() 
       WHERE code = $1 
       RETURNING id, used_count`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon usage recorded',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Coupon usage error:', error);
    res.status(500).json({ error: 'Failed to record coupon usage' });
  }
});

// GET /api/coupons/:code - Get coupon details (public)
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT id, code, discount_percentage, discount_amount, 
              description, active, expires_at
       FROM coupons 
       WHERE code = $1 AND active = true`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// ===== ADMIN ROUTES =====

// POST /api/coupons (admin) - Create coupon
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { code, discount_percentage, discount_amount, max_uses, expires_at, description, active } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const result = await pool.query(
      `INSERT INTO coupons (code, discount_percentage, discount_amount, max_uses, expires_at, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_percentage || null,
        discount_amount || null,
        max_uses || null,
        expires_at || null,
        description || null,
        active !== false
      ]
    );

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// GET /api/coupons (admin) - List all coupons
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, discount_percentage, discount_amount, max_uses, used_count,
              expires_at, description, active, created_at, updated_at
       FROM coupons
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// DELETE /api/coupons/:id (admin) - Delete coupon
router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM coupons WHERE id = $1 RETURNING id, code',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon deleted successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// PUT /api/coupons/:id (admin) - Update coupon
router.put('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_percentage, discount_amount, max_uses, expires_at, description, active } = req.body;

    const result = await pool.query(
      `UPDATE coupons 
       SET discount_percentage = COALESCE($1, discount_percentage),
           discount_amount = COALESCE($2, discount_amount),
           max_uses = COALESCE($3, max_uses),
           expires_at = COALESCE($4, expires_at),
           description = COALESCE($5, description),
           active = COALESCE($6, active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [discount_percentage, discount_amount, max_uses, expires_at, description, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon updated successfully',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

module.exports = router;
