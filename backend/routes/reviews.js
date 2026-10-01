const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: Validate rating
const validateRating = (rating) => {
  const r = parseInt(rating);
  return r >= 1 && r <= 5;
};

// Helper: Check if user has verified purchase
const hasVerifiedPurchase = async (userId, productId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status IN ('completed', 'shipped')`,
    [userId, productId]
  );
  return result.rows[0].count > 0;
};

// Helper: Check if user already reviewed this product
const userAlreadyReviewed = async (userId, productId) => {
  const result = await pool.query(
    `SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return result.rows.length > 0;
};

// POST - Create review
router.post('/:productId/reviews', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!rating || !title) {
      return res.status(400).json({ error: 'Rating and title are required' });
    }

    if (!validateRating(rating)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (comment && comment.length > 5000) {
      return res.status(400).json({ error: 'Comment cannot exceed 5000 characters' });
    }

    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    if (await userAlreadyReviewed(userId, productId)) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check verified purchase
    const verifiedPurchase = await hasVerifiedPurchase(userId, productId);

    // Create review
    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, title, comment, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, userId, rating, title, comment || null, verifiedPurchase]
    );

    const review = result.rows[0];

    // Create approval record (auto-approve for now, can be changed)
    await pool.query(
      `INSERT INTO review_approvals (review_id, status, reviewed_by, reviewed_at)
       VALUES ($1, 'approved', $2, NOW())`,
      [review.id, userId]
    );

    // Get user info for response
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      ...review,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - List reviews for a product with pagination and filters
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let query = `
      SELECT r.*, u.name as user_name, ra.status as approval_status
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_approvals ra ON r.id = ra.review_id
      WHERE r.product_id = $1 AND ra.status = 'approved'
    `;
    const params = [productId];

    if (rating && validateRating(rating)) {
      query += ` AND r.rating = $${params.length + 1}`;
      params.push(rating);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE r.product_id = $1 AND ra.status = 'approved'` +
       (rating && validateRating(rating) ? ` AND r.rating = $2` : ''),
      rating && validateRating(rating) ? [productId, rating] : [productId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY r.helpful_count DESC, r.created_at DESC
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

// GET - Product review statistics
router.get('/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_reviews,
        AVG(r.rating)::DECIMAL(3,2) as average_rating,
        SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE r.product_id = $1 AND ra.status = 'approved'`,
      [productId]
    );

    const stats = result.rows[0];

    res.json({
      product_id: productId,
      total_reviews: parseInt(stats.total_reviews),
      average_rating: stats.average_rating ? parseFloat(stats.average_rating) : 0,
      distribution: {
        five_star: parseInt(stats.five_star) || 0,
        four_star: parseInt(stats.four_star) || 0,
        three_star: parseInt(stats.three_star) || 0,
        two_star: parseInt(stats.two_star) || 0,
        one_star: parseInt(stats.one_star) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update review (only own review)
router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Get review
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    // Check ownership
    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own review' });
    }

    // Validate inputs if provided
    if (rating && !validateRating(rating)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (title && title.trim().length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (comment && comment.length > 5000) {
      return res.status(400).json({ error: 'Comment cannot exceed 5000 characters' });
    }

    // Update review
    const result = await pool.query(
      `UPDATE reviews SET
        rating = COALESCE($1, rating),
        title = COALESCE($2, title),
        comment = COALESCE($3, comment),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [rating || null, title || null, comment || null, reviewId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete review (only own review or admin)
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Get review
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    // Check ownership
    if (review.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own review' });
    }

    // Delete review (cascade deletes approvals and votes)
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Mark review as helpful
router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already voted
    const voteResult = await pool.query(
      'SELECT id FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (voteResult.rows.length > 0) {
      // Remove vote (toggle)
      await pool.query(
        'DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );

      // Decrease helpful count
      await pool.query(
        'UPDATE reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = $1',
        [reviewId]
      );
    } else {
      // Add vote
      await pool.query(
        'INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)',
        [reviewId, userId]
      );

      // Increase helpful count
      await pool.query(
        'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
        [reviewId]
      );
    }

    // Get updated review
    const updated = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
