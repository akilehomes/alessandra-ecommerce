const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mercadopago = require('mercadopago');
const { Pool } = require('pg');
const { sendOrderConfirmation } = require('../services/emailService');
const agentService = require('../services/agentService');
const { registerCouponUse } = require('../services/couponService');
const { decrementStockForOrder } = require('../services/stockService');

// Simulacao de pagamento: so em dev, ligada explicitamente. Fechada por padrao.
const SIMULATION_ENABLED = process.env.ALLOW_PAYMENT_SIMULATION === 'true';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Setup MercadoPago (comentado por agora - usar versão mais recente)
// mercadopago.configure({
//   access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
// });

// POST process payment (simplified for demo)
router.post('/process', async (req, res) => {
  if (!SIMULATION_ENABLED) {
    return res.status(503).json({ error: 'Payment processing is not available' });
  }
  try {
    const { orderId, amount, cardNumber, expiry, cvc } = req.body;

    // Validar dados do cartão (básico)
    if (!cardNumber || !expiry || !cvc) {
      return res.status(400).json({ error: 'Invalid card data' });
    }

    // Simular processamento Stripe
    // Em produção: usar stripe.paymentIntents.create()
    const paymentId = `pi_${Date.now()}`;

    res.json({
      status: 'success',
      message: 'Payment processed successfully',
      paymentId,
      orderId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marca o pedido como pago uma unica vez e envia o e-mail so na primeira vez
// (a confirmacao pode chegar pelo navegador e pelo webhook).
async function markOrderPaid(orderId, paymentId) {
  const updated = await pool.query(
    `UPDATE orders
     SET status = 'paid', payment_id = $1, updated_at = NOW()
     WHERE id = $2 AND status <> 'paid'
     RETURNING *`,
    [paymentId, orderId]
  );
  if (updated.rows.length === 0) return false;
  const order = updated.rows[0];
  await registerCouponUse(order.coupon_code);
  await decrementStockForOrder(pool, order.id);
  try {
    await sendOrderConfirmation(order, order.customer_email);
  } catch (err) {
    console.error('Order confirmation email failed:', err.message);
  }
  return true;
}

const CURRENCIES = { BRL: 'brl', EUR: 'eur' };

// Chave publica do Stripe servida pelo backend: garante o mesmo par da chave secreta
router.get('/config', (req, res) => {
  if (!process.env.STRIPE_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Payments are not configured' });
  }
  res.json({ publishableKey: process.env.STRIPE_PUBLIC_KEY });
});

// POST create payment intent (Stripe)
// O valor vem do pedido salvo no banco, nunca do navegador.
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const orderResult = await pool.query(
      'SELECT id, total, status, customer_email, region FROM orders WHERE id = $1',
      [orderId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderResult.rows[0];
    if (order.status !== 'pending') {
      return res.status(409).json({ error: 'Order is not awaiting payment' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: CURRENCIES[order.region] || 'brl',
      automatic_payment_methods: { enabled: true },
      receipt_email: order.customer_email,
      metadata: { orderId: order.id, customerEmail: order.customer_email },
    });

    await pool.query('UPDATE orders SET payment_id = $1 WHERE id = $2', [paymentIntent.id, order.id]);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error.message);
    res.status(500).json({ error: 'Could not start payment' });
  }
});

// POST confirm payment (Stripe)
// Nunca confia no navegador: consulta o Stripe e confere pedido e valor.
router.post('/stripe/confirm', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (typeof paymentIntentId !== 'string' || !orderId) {
      return res.status(400).json({ error: 'paymentIntentId and orderId are required' });
    }

    // Modo simulacao (somente dev, ligado por ALLOW_PAYMENT_SIMULATION)
    if (paymentIntentId.startsWith('sim_test_')) {
      if (!SIMULATION_ENABLED) {
        return res.status(403).json({ error: 'Payment simulation is disabled' });
      }
      await markOrderPaid(orderId, paymentIntentId);
      return res.json({ status: 'success', message: 'Payment confirmed (simulation mode)', orderId });
    }

    const orderResult = await pool.query('SELECT id, total, status FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const expectedAmount = Math.round(Number(order.total) * 100);

    if (
      paymentIntent.status !== 'succeeded' ||
      paymentIntent.metadata.orderId !== order.id ||
      paymentIntent.amount_received !== expectedAmount
    ) {
      return res.status(400).json({ status: 'failed', message: 'Payment not completed' });
    }

    await markOrderPaid(order.id, paymentIntent.id);
    res.json({ status: 'success', message: 'Payment confirmed', orderId: order.id });
  } catch (error) {
    console.error('Confirm payment error:', error.message);
    res.status(500).json({ error: 'Could not confirm payment' });
  }
});

// POST create preference (MercadoPago - Boleto/PIX/Cartão)
router.post('/mercadopago/create-preference', async (req, res) => {
  try {
    const { orderId, amount, items, payerEmail, payerName, paymentMethod } = req.body;

    const preference = {
      items: items.map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
      })),
      payer: {
        name: payerName,
        email: payerEmail,
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
      external_reference: orderId,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success?orderId=${orderId}`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure?orderId=${orderId}`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending?orderId=${orderId}`,
      },
      auto_return: 'approved',
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST webhook MercadoPago
router.post('/mercadopago/webhook', async (req, res) => {
  try {
    const { data, type } = req.query;

    if (type === 'payment') {
      const paymentData = await mercadopago.payment.findById(data.id);
      const payment = paymentData.body;

      const orderId = payment.external_reference;
      let orderStatus = 'payment_processing';

      if (payment.status === 'approved') {
        orderStatus = 'paid';
      } else if (payment.status === 'rejected') {
        orderStatus = 'cancelled';
      }

      // Update order
      await pool.query(
        `UPDATE orders
         SET status = $1, payment_id = $2, updated_at = NOW()
         WHERE order_number = $3`,
        [orderStatus, payment.id, orderId]
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      'SELECT id, status, payment_method, payment_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST PIX payment (via MercadoPago)
router.post('/pix/create', async (req, res) => {
  try {
    const { amount, orderId, customerEmail } = req.body;

    const payment = {
      transaction_amount: amount,
      payment_method_id: 'pix',
      payer: {
        email: customerEmail,
      },
      external_reference: orderId,
      description: `Order #${orderId}`,
    };

    const response = await mercadopago.payment.create(payment);

    if (response.status === 201) {
      res.json({
        status: 'success',
        qrCode: response.body.point_of_interaction.transaction_data.qr_code,
        qrCodeUrl: response.body.point_of_interaction.transaction_data.qr_code_url,
        paymentId: response.body.id,
      });
    } else {
      res.status(400).json({ error: 'Failed to create PIX payment' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
