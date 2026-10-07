const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const { sendOrderConfirmation } = require('../services/emailService');
const agentService = require('../services/agentService');
const { registerCouponUse } = require('../services/couponService');
const { decrementStockForOrder } = require('../services/stockService');
const { attachItems } = require('../services/orderService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Stripe Webhook
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({error: error.message});
  }
});

async function handlePaymentSucceeded(paymentIntent) {
  const { metadata: { orderId, customerEmail } } = paymentIntent;

  if (!orderId) return;

  // Marca como pago so se o valor recebido bate com o total do pedido; idempotente
  const updated = await pool.query(
    `UPDATE orders SET status = 'paid', payment_id = $1, updated_at = NOW()
     WHERE id = $2 AND status <> 'paid' AND ROUND(total * 100) = $3
     RETURNING *`,
    [paymentIntent.id, orderId, paymentIntent.amount_received]
  );

  if (updated.rows.length === 0) {
    console.log(`ℹ️ Pedido ${orderId} ja estava pago ou valor nao confere; nada a fazer`);
    return;
  }

  const order = updated.rows[0];
  await registerCouponUse(order.coupon_code);
  await decrementStockForOrder(pool, order.id);
  try {
    await sendOrderConfirmation(await attachItems(pool, order), customerEmail || order.customer_email);
  } catch (err) {
    console.error('Order confirmation email failed:', err.message);
  }

  // Processar com Agente (automações)
  agentService.processOrder(order).catch(err =>
    console.error('Agent processing error:', err)
  );

  console.log(`✅ Pagamento confirmado para pedido ${orderId}`);
}

async function handlePaymentFailed(paymentIntent) {
  const { metadata: { orderId } } = paymentIntent;

  if (!orderId) return;

  // Mantem o pedido 'pending': o cliente pode tentar de novo com outro cartao
  console.log(`❌ Tentativa de pagamento falhou para pedido ${orderId}`);
}

async function handleRefund(charge) {
  const { payment_intent } = charge;

  const result = await pool.query(
    `UPDATE orders SET status = 'refunded', updated_at = NOW() WHERE payment_id = $1 RETURNING id`,
    [payment_intent]
  );

  if (result.rows.length > 0) {
    console.log(`💰 Reembolso processado para pedido ${result.rows[0].id}`);
  }
}

module.exports = router;
