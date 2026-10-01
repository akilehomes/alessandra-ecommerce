-- Alinha bancos criados com schema-minimal.sql ao que o codigo realmente usa.
-- Somente aditivo e idempotente (pode rodar mais de uma vez).

-- users: campos de seguranca usados por routes/auth.js
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP,
  ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- products: dimensoes e metadados usados por routes/products.js e frete
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 3),
  ADD COLUMN IF NOT EXISTS height DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS width DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS depth DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';

-- carts / cart_items: routes/cart.js grava variant_id e price
ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- orders: colunas gravadas por routes/orders.js e payment.js
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Tabelas usadas pelo codigo e ausentes em todos os arquivos SQL do projeto
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(30),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  custom_description TEXT,
  quantity INTEGER DEFAULT 1,
  quote_price DECIMAL(10, 2),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_product ON stock_reservations(product_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
