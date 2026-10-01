-- carts.expires_at era NOT NULL sem valor padrao no schema minimo; POST /api/cart/init falhava com 500
ALTER TABLE carts ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');
