const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { app, pool } = require('../server');

// GET cart
router.get('/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;

    const cartResult = await pool.query(
      'SELECT * FROM carts WHERE id = $1',
      [cartId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemsResult = await pool.query(
      `SELECT ci.*, p.name, p.image_url, pv.attribute_name, pv.attribute_value
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    const total = itemsResult.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      cart: cartResult.rows[0],
      items: itemsResult.rows,
      total,
      itemCount: itemsResult.rows.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create/get cart (or create session)
router.post('/init', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = uuidv4();

    let cartResult;

    if (userId) {
      cartResult = await pool.query(
        'SELECT * FROM carts WHERE user_id = $1 AND expires_at > NOW()',
        [userId]
      );
    }

    if (!cartResult || cartResult.rows.length === 0) {
      cartResult = await pool.query(
        `INSERT INTO carts (user_id, session_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId || null, sessionId]
      );
    }

    res.json({
      cartId: cartResult.rows[0].id,
      sessionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add to cart
router.post('/:cartId/items', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productId, variantId, quantity, price } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    // Check if product already in cart
    const existingResult = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))',
      [cartId, productId, variantId]
    );

    let result;

    if (existingResult.rows.length > 0) {
      // Update quantity
      result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3 RETURNING *',
        [quantity, cartId, productId]
      );
    } else {
      // Add new item
      result = await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [cartId, productId, variantId, quantity, price]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update cart item
router.put('/:cartId/items/:itemId', async (req, res) => {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Delete item if quantity is 0
      await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
      return res.json({ message: 'Item removed from cart' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING *',
      [quantity, itemId, cartId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE remove from cart
router.delete('/:cartId/items/:itemId', async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [itemId, cartId]);

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE clear cart
router.delete('/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;

    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST apply coupon
router.post('/:cartId/coupon', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { couponCode, subtotal } = req.body;

    const result = await pool.query(
      `SELECT * FROM coupons
       WHERE code = $1
       AND active = true
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (max_uses IS NULL OR current_uses < max_uses)`,
      [couponCode.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Coupon not found or expired' });
    }

    const coupon = result.rows[0];

    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return res.status(400).json({ error: `Minimum order value of R$ ${coupon.min_order_value} required` });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }

    res.json({
      coupon: couponCode.toUpperCase(),
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount: discount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
