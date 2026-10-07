-- Estoque e status do produto.
-- stock_quantity NULL = sem controle de estoque; 0 = esgotado.
-- status: 'active' (a venda), 'draft' (rascunho, escondido) ou 'archived' (fora de venda).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

UPDATE products SET status = 'archived' WHERE is_active = false AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
