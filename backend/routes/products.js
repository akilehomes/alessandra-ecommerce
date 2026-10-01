const express = require('express');
const router = express.Router();
const { app, pool } = require('../server');

// GET all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, featured = false } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    if (featured === 'true') {
      query += ' AND is_featured = true';
    }

    const countResult = await pool.query(query, params);
    const total = countResult.rows.length;

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product with inventory and images
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inventoryResult = await pool.query(
      'SELECT * FROM product_inventory WHERE product_id = $1',
      [id]
    );

    // Get additional images ordered by position
    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position ASC',
      [id]
    );

    const product = productResult.rows[0];
    const inventory = inventoryResult.rows[0];
    const images = imagesResult.rows || [];

    // Use only product_images, ordered by position
    const allImages = images.map(img => ({
      url: img.image_url,
      is_primary: img.is_primary,
      product_id: id
    }));

    res.json({
      ...product,
      images: allImages,
      inventory: inventory || { quantity: 0, reserved: 0 },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET product availability (for "Avise-me quando chegar")
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        pi.quantity - pi.reserved as available,
        pi.quantity,
        pi.reserved,
        (SELECT COUNT(*) FROM stock_reservations WHERE product_id = $1 AND status = 'active') as reservation_count
      FROM product_inventory pi
      WHERE pi.product_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST stock reservation (Avise-me quando chegar)
router.post('/:id/notify-me', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      `INSERT INTO stock_reservations (product_id, email, quantity, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, email, 1, 'active']
    );

    // TODO: Send confirmation email

    res.status(201).json({
      message: 'Notification registered. You will receive an email when the product is back in stock.',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST quotation request
router.post('/quotation/request', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, product_id, custom_description, quantity } = req.body;

    if (!customer_email || !customer_name) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO quotations (customer_name, customer_email, customer_phone, product_id, custom_description, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customer_name, customer_email, customer_phone, product_id, custom_description, quantity]
    );

    // TODO: Send notification email to admin

    res.status(201).json({
      message: 'Quotation request received. We will contact you soon.',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
