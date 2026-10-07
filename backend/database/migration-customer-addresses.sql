-- Dados do cliente (pessoa fisica/juridica, documento fiscal), enderecos salvos,
-- faturamento no pedido e preco em euro por produto.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS person_type VARCHAR(20) NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(40),
  ADD COLUMN IF NOT EXISTS state_registration VARCHAR(40),
  ADD COLUMN IF NOT EXISTS country VARCHAR(2) NOT NULL DEFAULT 'BR';

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL DEFAULT 'shipping',       -- 'shipping' ou 'billing'
  label VARCHAR(60),
  recipient_name VARCHAR(200),
  phone VARCHAR(25),
  country VARCHAR(2) NOT NULL DEFAULT 'BR',
  postal_code VARCHAR(20) NOT NULL,
  street VARCHAR(200) NOT NULL,
  number VARCHAR(30),
  complement VARCHAR(200),
  district VARCHAR(100),
  city VARCHAR(200) NOT NULL,
  state VARCHAR(100),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id, kind);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS destination_country VARCHAR(2),
  ADD COLUMN IF NOT EXISTS customer_person_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_document_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_document_number VARCHAR(40),
  ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Preco em euro: vazio = produto nao e vendido na Europa
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_eur DECIMAL(10, 2);
