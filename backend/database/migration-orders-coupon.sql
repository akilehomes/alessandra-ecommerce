-- Guarda qual cupom foi usado no pedido (o uso so e contado quando o pedido e pago)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
