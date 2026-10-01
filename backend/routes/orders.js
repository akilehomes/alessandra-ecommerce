const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// POST create order from cart
router.post('/', async (req, res) => {
  try {
    const {
      cartId,
      items: bodyItems,
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      paymentMethod,
      couponCode,
      shippingCost: clientShippingCost,
      currency,
      region,
    } = req.body;

    // Validate required fields
    if (!customerEmail || !shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ error: 'Email and shipping address are required' });
    }

    const clean = (v) => String(v ?? '').trim().slice(0, 200);
    const address = {
      street: clean(shippingAddress.street),
      number: clean(shippingAddress.number),
      complement: clean(shippingAddress.complement),
      city: clean(shippingAddress.city),
      state: clean(shippingAddress.state),
      cep: clean(shippingAddress.cep),
    };
    if (!address.street || !address.city || !address.state || !address.cep) {
      return res.status(400).json({ error: 'Shipping address is incomplete' });
    }

    // Get cart items
    let cartItems = bodyItems;
    if (!cartItems || cartItems.length === 0) {
      const cartItemsResult = await pool.query(
        'SELECT * FROM cart_items WHERE cart_id = $1',
        [cartId]
      );
      cartItems = cartItemsResult.rows;
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Precos, nomes e subtotal vem SEMPRE do banco; o cliente so informa produto e quantidade
    const requested = cartItems.map((item) => ({
      productId: item.product_id || item.id,
      quantity: Math.floor(Number(item.quantity)),
    }));
    if (requested.some((r) => !r.productId || !Number.isFinite(r.quantity) || r.quantity < 1 || r.quantity > 100)) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }
    const productIds = [...new Set(requested.map((r) => r.productId))];
    let productRows;
    try {
      productRows = (await pool.query(
        'SELECT id, name, price FROM products WHERE id = ANY($1::uuid[])',
        [productIds]
      )).rows;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }
    if (productRows.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products are unavailable' });
    }
    const byId = new Map(productRows.map((p) => [p.id, p]));
    cartItems = requested.map((r) => {
      const p = byId.get(r.productId);
      return { product_id: p.id, product_name: p.name, name: p.name, price: Number(p.price), quantity: r.quantity };
    });

    const TAX_RATE_BY_REGION = { BR: 0.18, PT: 0.23, EU: 0.21 };
    const subtotal = Math.round(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const tax = Math.round(subtotal * (TAX_RATE_BY_REGION[region] ?? TAX_RATE_BY_REGION.BR) * 100) / 100;
    const shippingCost = Math.max(0, Number(clientShippingCost) || 0); // TODO: recalcular frete no servidor

    // Calculate discount if coupon provided
    let discount = 0;
    if (couponCode) {
      const couponResult = await pool.query(
        'SELECT * FROM coupons WHERE code = $1 AND active = true',
        [couponCode.toUpperCase()]
      );

      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * Number(coupon.discount_value)) / 100;
        } else {
          discount = Number(coupon.discount_value);
        }

        // Increment coupon usage
        await pool.query(
          'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
          [coupon.id]
        );
      }
    }

    // Calculate total
    discount = Math.min(Math.max(0, Math.round(discount * 100) / 100), subtotal);
    const total = Math.round((subtotal + shippingCost + tax - discount) * 100) / 100;
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (
        user_id, order_number, status, subtotal, tax, shipping_cost, discount,
        total, customer_name, customer_email, customer_phone,
        payment_method, region, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
       RETURNING *`,
      [
        userId,
        orderNumber,
        'pending',
        subtotal,
        tax || 0,
        shippingCost || 0,
        discount,
        total,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        currency || 'BRL',
        JSON.stringify(address),
      ]
    );

    const order = orderResult.rows[0];

    // Insert order items and reserve stock
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          item.product_id || item.id,
          item.product_name || item.name,
          item.quantity,
          item.price
        ]
      );

      // Reserve stock
      await pool.query(
        `UPDATE product_inventory
         SET reserved = reserved + $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id || item.id]
      );
    }

    // Clear cart if cartId provided
    if (cartId) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    }

    res.status(201).json({
      id: order.id,
      orderId: order.id,
      orderNumber: order.order_number,
      total: order.total,
      status: order.status,
      message: 'Order created successfully. Proceeding to payment...',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// GET all orders (Admin)
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      'SELECT id, order_number, customer_name, customer_email, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET orders by user (protected)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Verify user is requesting their own orders
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, order_number, customer_name, customer_email, status, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET orders by email (public tracking)
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      'SELECT id, order_number, status, total, created_at FROM orders WHERE customer_email = $1 ORDER BY created_at DESC LIMIT 10',
      [email]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search orders error:', error);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});

// GET order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Get shipping info if exists
    const shippingResult = await pool.query(
      'SELECT * FROM shipping_tracking WHERE order_id = $1 LIMIT 1',
      [orderId]
    );

    res.json({
      ...order,
      items: itemsResult.rows,
      shipping: shippingResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT update order status (Admin only)
router.put('/:orderId/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'payment_processing',
      'paid',
      'shipped',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE cancel order
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Only cancel if not already paid/shipped
    if (['paid', 'shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel paid/shipped orders' });
    }

    // Release reserved stock
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await pool.query(
        `UPDATE product_inventory
         SET reserved = reserved - $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await pool.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
