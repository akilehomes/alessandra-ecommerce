-- Add weight and dimensions to products table for shipping calculation

ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS height DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS width DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10, 2) DEFAULT 0;

-- Create uploads directory storage table for product images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
