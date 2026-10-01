const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mercadopago = require('mercadopago');
const { Pool } = require('pg');
const { sendOrderConfirmation } = require('../services/emailService');
const agentService = require('../services/agentService');

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

// POST create payment intent (Stripe)
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, orderId, customerEmail } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'brl',
      metadata: {
        orderId,
        customerEmail,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST confirm payment (Stripe)
router.post('/stripe/confirm', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (typeof paymentIntentId !== 'string' || !orderId) {
      return res.status(400).json({ error: 'paymentIntentId and orderId are required' });
    }

    // Modo simulação para testes (sem Stripe Elements) - bloqueado fora do dev
    if (paymentIntentId.startsWith('sim_test_')) {
      if (!SIMULATION_ENABLED) {
        return res.status(403).json({ error: 'Payment simulation is disabled' });
      }
      console.log('✅ [SIM MODE] Confirmando pagamento:', paymentIntentId);

      // Atualizar status do pedido
      await pool.query(
        `UPDATE orders
         SET status = 'paid', payment_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [paymentIntentId, orderId]
      );

      // Enviar email de confirmação
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        await sendOrderConfirmation(order, order.customer_email);
        console.log('✉️ Email enviado para:', order.customer_email);
      }

      return res.json({
        status: 'success',
        message: 'Payment confirmed (simulation mode)',
        orderId,
      });
    }

    // Modo produção: verificar com Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      await pool.query(
        `UPDATE orders
         SET status = 'paid', payment_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [paymentIntentId, orderId]
      );

      // Fetch order details to send confirmation email
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        await sendOrderConfirmation(order, order.customer_email);
      }

      res.json({
        status: 'success',
        message: 'Payment confirmed',
        orderId,
      });
    } else {
      res.status(400).json({
        status: 'failed',
        message: 'Payment not completed',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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
