-- Adicionar suporte multi-região ao schema existente

-- Produtos com preços por região
ALTER TABLE products ADD COLUMN region VARCHAR(10) DEFAULT 'BR'; -- BR, PT, EU

-- Tabela de preços por região
CREATE TABLE product_prices_by_region (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  region VARCHAR(10) NOT NULL, -- BR, PT, EU
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  tax_percentage DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, region)
);

-- Atualizar tabela de usuários para múltiplos endereços
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20), -- 'shipping', 'billing', 'personal'
  country_code VARCHAR(2), -- BR, PT, etc
  region VARCHAR(10),
  street VARCHAR(255),
  number VARCHAR(10),
  complement VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suporte multi-moeda
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3), -- BRL
  to_currency VARCHAR(3),   -- EUR, USD
  rate DECIMAL(10, 4) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajustar tabela de pedidos para múltiplas regiões
ALTER TABLE orders ADD COLUMN region VARCHAR(10) DEFAULT 'BR';
ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'BRL';
ALTER TABLE orders ADD COLUMN shipping_from VARCHAR(10); -- De onde saiu (BR ou PT)

-- Meios de pagamento por região
CREATE TABLE regional_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(10) NOT NULL,
  payment_method VARCHAR(50),
  provider VARCHAR(50), -- stripe, mercadopago, klarna
  enabled BOOLEAN DEFAULT true,
  fee_percentage DECIMAL(5, 3),
  fee_fixed DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region, payment_method)
);

-- Transportadoras por zona
CREATE TABLE shipping_carriers_by_zone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_region VARCHAR(10), -- BR, PT
  to_region VARCHAR(10),   -- BR, PT, EU, etc
  carrier_name VARCHAR(100),
  carrier_code VARCHAR(50),
  max_days_delivery INTEGER,
  base_price DECIMAL(10, 2),
  price_per_kg DECIMAL(10, 2),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_products_region ON products(region);
CREATE INDEX idx_product_prices_region ON product_prices_by_region(region);
CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_orders_region ON orders(region);
CREATE INDEX idx_shipping_carriers_zones ON shipping_carriers_by_zone(from_region, to_region);
