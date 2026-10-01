// Cupons de desconto: valida no banco e calcula o desconto sobre o subtotal do SERVIDOR.
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class CouponError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const round2 = (n) => Math.round(n * 100) / 100;

// Devolve { code, discount } ou lanca CouponError (cupom inexistente, vencido ou esgotado)
async function resolveCoupon(code, subtotal) {
  const result = await pool.query(
    `SELECT code, discount_percentage, discount_amount, max_uses, used_count, expires_at
     FROM coupons
     WHERE UPPER(code) = UPPER($1) AND active = true`,
    [String(code).trim()]
  );

  if (result.rows.length === 0) throw new CouponError('Invalid coupon code');
  const coupon = result.rows[0];

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new CouponError('Coupon has expired');
  }
  if (coupon.max_uses && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) {
    throw new CouponError('Coupon usage limit reached');
  }

  let discount = 0;
  if (Number(coupon.discount_percentage) > 0) {
    discount = (subtotal * Number(coupon.discount_percentage)) / 100;
  } else if (Number(coupon.discount_amount) > 0) {
    discount = Number(coupon.discount_amount);
  }
  discount = round2(Math.min(Math.max(0, discount), subtotal)); // nunca passa do subtotal

  return { code: coupon.code, discount };
}

// Conta o uso do cupom (chamado quando o pedido e pago, uma unica vez)
async function registerCouponUse(code) {
  if (!code) return;
  try {
    await pool.query(
      'UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1, updated_at = NOW() WHERE UPPER(code) = UPPER($1)',
      [code]
    );
  } catch (err) {
    console.error('Coupon usage count failed:', err.message);
  }
}

module.exports = { resolveCoupon, registerCouponUse, CouponError };
