-- Idioma em que o cliente fez a compra (pt/en): os e-mails do pedido saem nesse idioma
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_language VARCHAR(5);
