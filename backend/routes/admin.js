const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const JWT_EXPIRATION = '30d';
const BCRYPT_ROUNDS = 10;

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

// ============ AUTHENTICATION ============

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    );

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/logout
router.post('/logout', adminAuthMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============ DASHBOARD ============

// GET /api/admin/dashboard
router.get('/dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const totalOrders = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalRevenue = await pool.query('SELECT SUM(total) as total FROM orders WHERE status != $1', ['cancelled']);
    const paidOrders = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['paid']);
    const pendingOrders = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']);
    const totalProducts = await pool.query('SELECT COUNT(*) as count FROM products');

    res.json({
      totalOrders: parseInt(totalOrders.rows[0].count) || 0,
      totalRevenue: parseFloat(totalRevenue.rows[0].total) || 0,
      paidOrders: parseInt(paidOrders.rows[0].count) || 0,
      pendingOrders: parseInt(pendingOrders.rows[0].count) || 0,
      totalProducts: parseInt(totalProducts.rows[0].count) || 0,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ PRODUCTS ============

// GET /api/admin/products
router.get('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Converte campo numerico do formulario: '' / undefined -> null; invalido -> NaN
const toNumber = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
const toText = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

// Normaliza e valida os campos de produto vindos do painel
function parseProductBody(body) {
  const data = {
    name: toText(body.name),
    description: toText(body.description),
    price: toNumber(body.price),
    category: toText(body.category),
    image_url: toText(body.image_url),
    weight: toNumber(body.weight),
    height: toNumber(body.height),
    width: toNumber(body.width),
    depth: toNumber(body.depth),
    sku: toText(body.sku),
    location: toText(body.location),
    currency: toText(body.currency),
  };
  for (const key of ['price', 'weight', 'height', 'width', 'depth']) {
    if (data[key] !== null && (!Number.isFinite(data[key]) || data[key] < 0)) {
      return { error: `Invalid value for ${key}` };
    }
  }
  if (data.currency && !['BRL', 'EUR'].includes(data.currency.toUpperCase())) {
    return { error: 'Invalid currency' };
  }
  if (data.currency) data.currency = data.currency.toUpperCase();
  return { data };
}

const slugify = (text) =>
  String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// POST /api/admin/products
router.post('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const { data, error } = parseProductBody(req.body);
    if (error) return res.status(400).json({ error });
    if (!data.name || !(data.price > 0)) {
      return res.status(400).json({ error: 'Name and a price greater than zero are required' });
    }

    const slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
    const result = await pool.query(
      `INSERT INTO products
         (name, slug, description, price, category, image_url, weight, height, width, depth, sku, location, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 'BR'), COALESCE($13, 'BRL'))
       RETURNING *`,
      [data.name, slug, data.description, data.price, data.category, data.image_url,
       data.weight, data.height, data.width, data.depth, data.sku, data.location, data.currency]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ error: 'Could not create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = parseProductBody(req.body);
    if (error) return res.status(400).json({ error });
    if (data.price !== null && !(data.price > 0)) {
      return res.status(400).json({ error: 'Price must be greater than zero' });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category = COALESCE($4, category),
           image_url = COALESCE($5, image_url),
           weight = COALESCE($6, weight),
           height = COALESCE($7, height),
           width = COALESCE($8, width),
           depth = COALESCE($9, depth),
           sku = COALESCE($10, sku),
           location = COALESCE($11, location),
           currency = COALESCE($12, currency),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [data.name, data.description, data.price, data.category, data.image_url, data.weight,
       data.height, data.width, data.depth, data.sku, data.location, data.currency, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ error: 'Could not update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PRODUCT IMAGES ============

// GET /api/admin/products/:id/images
router.get('/products/:id/images', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position ASC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/products/:id/images
router.post('/products/:id/images', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, is_primary } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await pool.query(
      `INSERT INTO product_images (product_id, image_url, is_primary)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, image_url, is_primary || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/products/:id/images/:imageId
router.put('/products/:id/images/:imageId', adminAuthMiddleware, async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const { is_primary, position } = req.body;

    let updateQuery = 'UPDATE product_images SET ';
    let params = [];
    let paramCount = 1;

    if (is_primary !== undefined) {
      updateQuery += `is_primary = $${paramCount}`;
      params.push(is_primary);
      paramCount++;
    }

    if (position !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += `position = $${paramCount}`;
      params.push(position);
      paramCount++;
    }

    updateQuery += ` WHERE id = $${paramCount} AND product_id = $${paramCount + 1} RETURNING *`;
    params.push(imageId, id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/products/:id/images/:imageId
router.delete('/products/:id/images/:imageId', adminAuthMiddleware, async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const result = await pool.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING *',
      [imageId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ORDERS ============

// GET /api/admin/orders
router.get('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM orders';
    let params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SHIPPING RATES ============

// GET /api/admin/shipping-rates
router.get('/shipping-rates', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipping_rates ORDER BY origin_city ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/shipping-rates/:id
router.put('/shipping-rates/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { base_price, price_per_kg, estimated_days, active } = req.body;

    let query = 'UPDATE shipping_rates SET ';
    let params = [];
    let paramCount = 1;

    if (base_price !== undefined) {
      query += `base_price = $${paramCount}`;
      params.push(base_price);
      paramCount++;
    }

    if (price_per_kg !== undefined) {
      if (params.length > 0) query += ', ';
      query += `price_per_kg = $${paramCount}`;
      params.push(price_per_kg);
      paramCount++;
    }

    if (estimated_days !== undefined) {
      if (params.length > 0) query += ', ';
      query += `estimated_days = $${paramCount}`;
      params.push(estimated_days);
      paramCount++;
    }

    if (active !== undefined) {
      if (params.length > 0) query += ', ';
      query += `active = $${paramCount}`;
      params.push(active);
      paramCount++;
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += `, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TAX RATES ============

// GET /api/admin/tax-rates
router.get('/tax-rates', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tax_rates ORDER BY country ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/tax-rates/:id
router.put('/tax-rates/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_rate, active } = req.body;

    let query = 'UPDATE tax_rates SET ';
    let params = [];
    let paramCount = 1;

    if (tax_rate !== undefined) {
      query += `tax_rate = $${paramCount}`;
      params.push(tax_rate);
      paramCount++;
    }

    if (active !== undefined) {
      if (params.length > 0) query += ', ';
      query += `active = $${paramCount}`;
      params.push(active);
      paramCount++;
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += `, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tax rate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CURRENCY RATES ============

// GET /api/admin/currency-rates
router.get('/currency-rates', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM currency_rates ORDER BY from_currency ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/currency-rates/:id
router.put('/currency-rates/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate } = req.body;

    if (rate === undefined) {
      return res.status(400).json({ error: 'Rate is required' });
    }

    const result = await pool.query(
      'UPDATE currency_rates SET rate = $1, last_updated = NOW() WHERE id = $2 RETURNING *',
      [rate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Currency rate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ QUOTATIONS ============

// GET /api/admin/quotations
router.get('/quotations', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotations ORDER BY requested_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/quotations/:id
router.put('/quotations/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quote_price } = req.body;

    const result = await pool.query(
      'UPDATE quotations SET quote_price = $1, status = $2, sent_at = NOW() WHERE id = $3 RETURNING *',
      [quote_price, 'sent', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REVIEWS MANAGEMENT ============

// GET /api/admin/reviews - List all reviews
router.get('/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', productId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.name as user_name, p.name as product_name, ra.status as approval_status, ra.reason
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
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
    const countQuery = `SELECT COUNT(*) as count FROM reviews r
       LEFT JOIN review_approvals ra ON r.id = ra.review_id
       WHERE 1=1` +
       (status ? ` AND ra.status = $1` : '') +
       (productId && status ? ` AND r.product_id = $2` : (productId ? ` AND r.product_id = $1` : ''));

    const countParams = status && productId ? [status, productId] : (status ? [status] : (productId ? [productId] : []));
    const countResult = await pool.query(countQuery, countParams);
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

// PUT /api/admin/reviews/:reviewId/approve
router.put('/reviews/:reviewId/approve', adminAuthMiddleware, async (req, res) => {
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

// PUT /api/admin/reviews/:reviewId/reject
router.put('/reviews/:reviewId/reject', adminAuthMiddleware, async (req, res) => {
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

// DELETE /api/admin/reviews/:reviewId
router.delete('/reviews/:reviewId', adminAuthMiddleware, async (req, res) => {
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

// GET /api/admin/reviews/analytics/:productId
router.get('/reviews/analytics/:productId', adminAuthMiddleware, async (req, res) => {
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
