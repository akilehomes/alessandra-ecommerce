-- Create product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(50),
  color VARCHAR(50),
  material VARCHAR(100),
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  weight DECIMAL(8, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create variant options table (for size/color/material options)
CREATE TABLE IF NOT EXISTS variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_name VARCHAR(50) NOT NULL,
  attribute_value VARCHAR(100) NOT NULL,
  UNIQUE(product_id, attribute_name, attribute_value)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variant_options_product_id ON variant_options(product_id);
