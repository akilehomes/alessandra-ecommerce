const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/wishlist/:productId - Add to wishlist
router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, productId]
    );

    res.status(201).json({
      message: 'Added to wishlist',
      item: result.rows[0] || { user_id: userId, product_id: parseInt(productId) }
    });
  } catch (error) {
    console.error('Wishlist add error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Wishlist remove error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// GET /api/wishlist - List user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT w.id, w.user_id, w.product_id, w.created_at,
              p.name, p.price, p.description, p.image_url
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Wishlist get error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// GET /api/wishlist/:productId/check - Check if product is in wishlist
router.get('/:productId/check', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({ inWishlist: result.rows.length > 0 });
  } catch (error) {
    console.error('Wishlist check error:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

module.exports = router;
