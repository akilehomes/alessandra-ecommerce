const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// GET /api/variants/:productId - Get product variants
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const [variantsResult, optionsResult] = await Promise.all([
      pool.query(
        'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY name',
        [productId]
      ),
      pool.query(
        'SELECT DISTINCT attribute_name, attribute_value FROM variant_options WHERE product_id = $1 ORDER BY attribute_name, attribute_value',
        [productId]
      )
    ]);

    // Group options by attribute
    const options = {};
    optionsResult.rows.forEach(row => {
      if (!options[row.attribute_name]) {
        options[row.attribute_name] = [];
      }
      options[row.attribute_name].push(row.attribute_value);
    });

    res.json({
      variants: variantsResult.rows,
      options: options
    });
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

// GET /api/variants/sku/:sku - Get variant by SKU
router.get('/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const result = await pool.query(
      'SELECT * FROM product_variants WHERE sku = $1 AND is_active = true',
      [sku]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get variant error:', error);
    res.status(500).json({ error: 'Failed to fetch variant' });
  }
});

// ===== ADMIN ROUTES =====

// POST /api/variants (admin) - Create variant
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { product_id, sku, name, size, color, material, price, stock, weight } = req.body;

    if (!product_id || !sku || !name) {
      return res.status(400).json({ error: 'product_id, sku, and name are required' });
    }

    const result = await pool.query(
      `INSERT INTO product_variants (product_id, sku, name, size, color, material, price, stock, weight)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [product_id, sku.toUpperCase(), name, size || null, color || null, material || null, price || null, stock || 0, weight || null]
    );

    res.status(201).json({
      message: 'Variant created successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Create variant error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create variant' });
  }
});

// PUT /api/variants/:id (admin) - Update variant
router.put('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, size, color, material, price, stock, weight, is_active } = req.body;

    const result = await pool.query(
      `UPDATE product_variants 
       SET name = COALESCE($1, name),
           size = COALESCE($2, size),
           color = COALESCE($3, color),
           material = COALESCE($4, material),
           price = COALESCE($5, price),
           stock = COALESCE($6, stock),
           weight = COALESCE($7, weight),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, size, color, material, price, stock, weight, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json({
      message: 'Variant updated successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

// DELETE /api/variants/:id (admin) - Soft delete variant
router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE product_variants SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, sku',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json({
      message: 'Variant deleted successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

// POST /api/variants/options/:productId (admin) - Add variant option
router.post('/options/:productId', adminAuthMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { attribute_name, attribute_value } = req.body;

    if (!attribute_name || !attribute_value) {
      return res.status(400).json({ error: 'attribute_name and attribute_value are required' });
    }

    const result = await pool.query(
      `INSERT INTO variant_options (product_id, attribute_name, attribute_value)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [productId, attribute_name, attribute_value]
    );

    res.status(201).json({
      message: 'Option added successfully',
      option: result.rows[0] || { product_id: productId, attribute_name, attribute_value }
    });
  } catch (error) {
    console.error('Add option error:', error);
    res.status(500).json({ error: 'Failed to add option' });
  }
});

module.exports = router;
