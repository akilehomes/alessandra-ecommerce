const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// GET - List all reviews for admin (with approval status)
router.get('/reviews', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', productId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.name as user_name, ra.status as approval_status, ra.reason
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_approvals ra ON r.id = ra.review_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND ra.status = $${params.length + 1}`;
      params.push(status);
    }

    if (productId) {
      query += ` AND r.product_id = $${params.length + 1}`;
      params.push(productId);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE 1=1` +
       (status ? ` AND ra.status = $1` : '') +
       (productId && status ? ` AND r.product_id = $2` : (productId ? ` AND r.product_id = $1` : '')),
      status && productId ? [status, productId] : (status ? [status] : (productId ? [productId] : []))
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY r.created_at DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Approve review
router.put('/reviews/:reviewId/approve', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const adminId = req.user.id;

    // Check if review exists
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update approval status
    await pool.query(
      `UPDATE review_approvals SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE review_id = $2`,
      [adminId, reviewId]
    );

    // Get updated review
    const updated = await pool.query(
      `SELECT r.*, ra.status as approval_status FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE r.id = $1`,
      [reviewId]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Reject review
router.put('/reviews/:reviewId/reject', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if review exists
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update approval status
    await pool.query(
      `UPDATE review_approvals SET status = 'rejected', reason = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE review_id = $3`,
      [reason || null, adminId, reviewId]
    );

    // Get updated review
    const updated = await pool.query(
      `SELECT r.*, ra.status as approval_status FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE r.id = $1`,
      [reviewId]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Remove review (admin only)
router.delete('/reviews/:reviewId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Check if review exists
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Delete review (cascade deletes approvals and votes)
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Product review analytics
router.get('/reviews/analytics/:productId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_reviews,
        SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN ra.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(r.rating)::DECIMAL(3,2) as average_rating,
        SUM(r.helpful_count) as total_helpful_votes,
        SUM(CASE WHEN r.verified_purchase THEN 1 ELSE 0 END) as verified_purchase_count
       FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE r.product_id = $1`,
      [productId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
