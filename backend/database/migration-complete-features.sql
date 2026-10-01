-- Tax Rates by Region
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(10) NOT NULL COMMENT 'BR, PT, EU',
  tax_type VARCHAR(50) NOT NULL COMMENT 'ICMS, IVA, VAT, etc',
  rate DECIMAL(5, 2) NOT NULL COMMENT 'Tax percentage',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(region, tax_type)
);

-- Product Reviews (enhanced)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, approved, rejected',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Review Moderation Log
CREATE TABLE IF NOT EXISTS review_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL COMMENT 'approved, rejected, edited',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shipping Zone Details
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  postal_code_range VARCHAR(50),
  state_province VARCHAR(100),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(region, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_rates_region ON tax_rates(region);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_region ON shipping_zones(region);

