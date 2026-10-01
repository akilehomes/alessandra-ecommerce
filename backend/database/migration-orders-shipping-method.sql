-- Guarda o frete escolhido pelo cliente em cada pedido (necessario para despachar corretamente)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_days INTEGER;
