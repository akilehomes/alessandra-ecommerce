-- O endereco de entrega era exigido no checkout, mas nunca salvo no pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
