-- Recuperacao de senha do admin: guarda o hash do token e a validade
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;
