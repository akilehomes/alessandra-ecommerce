-- Add missing fields to products table for multi-region, shipping, and dimensions

ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 3) COMMENT 'Weight in kg';
ALTER TABLE products ADD COLUMN IF NOT EXISTS width DECIMAL(8, 2) COMMENT 'Width in cm';
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(8, 2) COMMENT 'Height in cm';
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth DECIMAL(8, 2) COMMENT 'Depth in cm';
ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'BR' COMMENT 'Country code: BR (Brazil), PT (Portugal), EU (Europe)';
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL' COMMENT 'Currency: BRL, EUR, etc';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE COMMENT 'Stock Keeping Unit';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true COMMENT 'Product active status';

-- Add shipping rates table for different regions/zones
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(10) NOT NULL COMMENT 'BR, PT, EU, etc',
  zone VARCHAR(100) NOT NULL COMMENT 'Specific zone/state/region',
  min_weight DECIMAL(8, 3),
  max_weight DECIMAL(8, 3),
  base_rate DECIMAL(10, 2) NOT NULL,
  per_kg_rate DECIMAL(10, 2) DEFAULT 0,
  estimated_days INTEGER COMMENT 'Estimated delivery days',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(region, zone, min_weight, max_weight)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_region ON shipping_rates(region);

-- Add comment to orders table region field for clarity
ALTER TABLE orders MODIFY COLUMN region VARCHAR(10) DEFAULT 'BR' COMMENT 'Order region: BR (Brazil), PT (Portugal), EU (Europe)';

