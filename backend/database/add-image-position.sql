-- Add position column to product_images table
ALTER TABLE product_images ADD COLUMN position INTEGER DEFAULT 0;

-- Update existing images to have position based on their order
UPDATE product_images pi SET position = (
  SELECT COUNT(*) FROM product_images pi2 
  WHERE pi2.product_id = pi.product_id AND pi2.created_at <= pi.created_at
) - 1;
