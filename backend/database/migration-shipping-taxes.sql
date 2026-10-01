-- Migration: Add shipping rates, tax rates, and product weight

BEGIN;

-- Add weight column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2) DEFAULT 1.0;

-- Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_city VARCHAR(100) NOT NULL,
  dest_region VARCHAR(50) NOT NULL,
  min_weight DECIMAL(8, 2) DEFAULT 0,
  max_weight DECIMAL(8, 2),
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) DEFAULT 0,
  estimated_days INTEGER,
  carrier VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (origin_city, dest_region, carrier)
);

-- Create tax_rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(2) NOT NULL,
  region VARCHAR(100),
  tax_rate DECIMAL(5, 2) NOT NULL,
  tax_type VARCHAR(50) DEFAULT 'VAT',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country, region)
);

-- Create currency_rates table for exchange rates
CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE (from_currency, to_currency)
);

-- Seed initial shipping rates for BR and PT
INSERT INTO shipping_rates (origin_city, dest_region, base_price, price_per_kg, estimated_days, carrier, active)
VALUES 
  ('Sao Paulo', 'BR', 15.00, 0.50, 5, 'correios', true),
  ('Sao Paulo', 'PT', 25.00, 1.00, 10, 'fedex', true),
  ('Sao Paulo', 'EU', 28.00, 1.20, 14, 'fedex', true),
  ('Porto', 'BR', 30.00, 0.80, 12, 'dhl', true),
  ('Porto', 'PT', 5.00, 0.00, 2, 'local', true),
  ('Porto', 'EU', 15.00, 0.50, 7, 'dhl', true)
ON CONFLICT (origin_city, dest_region, carrier) DO NOTHING;

-- Seed initial tax rates
INSERT INTO tax_rates (country, region, tax_rate, tax_type, active)
VALUES 
  ('BR', NULL, 18.00, 'ICMS', true),
  ('PT', NULL, 23.00, 'VAT', true),
  ('ES', NULL, 21.00, 'VAT', true),
  ('FR', NULL, 20.00, 'VAT', true),
  ('DE', NULL, 19.00, 'VAT', true),
  ('IT', NULL, 22.00, 'VAT', true)
ON CONFLICT (country, region) DO NOTHING;

-- Seed currency rates
INSERT INTO currency_rates (from_currency, to_currency, rate)
VALUES 
  ('EUR', 'BRL', 5.90),
  ('BRL', 'EUR', 0.17),
  ('USD', 'BRL', 5.00),
  ('USD', 'EUR', 0.95)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipping_rates_region ON shipping_rates(dest_region);
CREATE INDEX IF NOT EXISTS idx_tax_rates_country ON tax_rates(country);
CREATE INDEX IF NOT EXISTS idx_currency_rates ON currency_rates(from_currency, to_currency);

COMMIT;
