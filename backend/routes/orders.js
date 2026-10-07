const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const { quoteForCart } = require('../services/shippingQuote');
const { resolveCoupon } = require('../services/couponService');

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
      shippingMethodId,
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
        "SELECT id, name, price, stock_quantity FROM products WHERE id = ANY($1::uuid[]) AND status = 'active'",
        [productIds]
      )).rows;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }
    if (productRows.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products are unavailable' });
    }
    const byId = new Map(productRows.map((p) => [p.id, p]));

    // Estoque: produtos com controle (stock_quantity) nao podem passar da quantidade disponivel
    const wanted = new Map();
    for (const r of requested) wanted.set(r.productId, (wanted.get(r.productId) || 0) + r.quantity);
    for (const [productId, qty] of wanted) {
      const p = byId.get(productId);
      if (p.stock_quantity !== null && qty > p.stock_quantity) {
        return res.status(409).json({
          error: p.stock_quantity > 0
            ? `Only ${p.stock_quantity} unit(s) of "${p.name}" available`
            : `"${p.name}" is out of stock`,
          code: 'OUT_OF_STOCK',
          productId,
          available: p.stock_quantity,
        });
      }
    }
    cartItems = requested.map((r) => {
      const p = byId.get(r.productId);
      return { product_id: p.id, product_name: p.name, name: p.name, price: Number(p.price), quantity: r.quantity };
    });

    const TAX_RATE_BY_REGION = { BR: 0.18, PT: 0.23, EU: 0.21 };
    const subtotal = Math.round(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const tax = Math.round(subtotal * (TAX_RATE_BY_REGION[region] ?? TAX_RATE_BY_REGION.BR) * 100) / 100;

    // Frete: no Brasil o servidor cota de novo e so aceita uma opcao que ele mesmo calculou
    let shippingCost;
    let chosenShipping = null; // opcao de frete confirmada pelo servidor
    if ((region || 'BR') === 'BR') {
      if (!shippingMethodId) {
        return res.status(400).json({ error: 'A shipping method is required' });
      }
      let quoted;
      try {
        quoted = await quoteForCart({
          items: cartItems.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
          zipCode: address.cep,
          country: 'BR',
        });
      } catch (e) {
        console.error('Shipping re-quote failed:', e.message);
        if (e.code === 'NO_SHIPPING_OPTIONS') {
          return res.status(400).json({
            error: 'This order needs special shipping. Please request a shipping quote.',
            code: 'NO_SHIPPING_OPTIONS',
          });
        }
        return res.status(e.status === 400 ? 400 : 502).json({ error: 'Could not confirm the shipping price. Please try again.' });
      }
      const chosen = quoted.find((o) => o.id === shippingMethodId);
      if (!chosen) {
        return res.status(400).json({ error: 'The selected shipping option is not available. Please choose again.' });
      }
      shippingCost = Math.round(Number(chosen.price) * 100) / 100;
      chosenShipping = chosen;
    } else {
      shippingCost = Math.max(0, Number(clientShippingCost) || 0); // TODO: cotar fora do Brasil no servidor
    }

    // Cupom: validado no banco e calculado sobre o subtotal do servidor.
    // Se o cliente enviou um cupom invalido/vencido, o pedido e recusado (ele esperava o desconto).
    let discount = 0;
    let appliedCouponCode = null;
    if (couponCode && String(couponCode).trim()) {
      try {
        const resolved = await resolveCoupon(couponCode, subtotal);
        discount = resolved.discount;
        appliedCouponCode = resolved.code;
      } catch (e) {
        if (e.status === 400) return res.status(400).json({ error: e.message });
        throw e;
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
        payment_method, region, shipping_address, coupon_code,
        shipping_method_id, shipping_carrier, shipping_service, shipping_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19)
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
        appliedCouponCode,
        chosenShipping ? chosenShipping.id : null,
        chosenShipping ? chosenShipping.carrier : null,
        chosenShipping ? chosenShipping.service : null,
        chosenShipping && Number.isFinite(Number(chosenShipping.delivery_time)) ? Math.round(Number(chosenShipping.delivery_time)) : null,
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
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const result = await pool.query(
      'SELECT id, order_number, customer_name, customer_email, status, total, region, shipping_carrier, shipping_service, coupon_code, created_at FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Limite simples em memoria: 10 consultas de rastreio por IP a cada 15 minutos
const trackHits = new Map();
const trackRateLimit = (req, res, next) => {
  const now = Date.now();
  const recent = (trackHits.get(req.ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  recent.push(now);
  trackHits.set(req.ip, recent);
  if (trackHits.size > 5000) trackHits.clear();
  if (recent.length > 10) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
};

// POST /api/orders/track  { orderNumber, email }
// Exige numero do pedido E e-mail; nao lista pedidos de ninguem. Devolve so o id do pedido.
router.post('/track', trackRateLimit, async (req, res) => {
  try {
    const orderNumber = String(req.body.orderNumber || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!orderNumber || !email) {
      return res.status(400).json({ error: 'Order number and email are required' });
    }

    const result = await pool.query(
      'SELECT id FROM orders WHERE UPPER(order_number) = UPPER($1) AND LOWER(customer_email) = $2 LIMIT 1',
      [orderNumber, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Track order error:', error.message);
    res.status(500).json({ error: 'Failed to find order' });
  }
});

// GET order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!UUID_RE.test(orderId)) {
      return res.status(404).json({ error: 'Order not found' });
    }

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
      `SELECT oi.product_name, oi.quantity, oi.price, p.name, p.image_url
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

    // O link /track/:id e enviado ao comprador por e-mail; so devolvemos o necessario
    res.json({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping_cost: order.shipping_cost,
      discount: order.discount,
      total: order.total,
      created_at: order.created_at,
      shipping_address: order.shipping_address || null,
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

// Identifica quem chama (usuario ou admin) sem exigir login em rotas que aceitam os dois
function getRequester(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.substring(7), process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// DELETE cancel order (dono do pedido ou admin)
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const requester = getRequester(req);
    if (!requester) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    // Get order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const isOwner = requester.userId && order.user_id && requester.userId === order.user_id;
    if (!requester.isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You cannot cancel this order' });
    }

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
