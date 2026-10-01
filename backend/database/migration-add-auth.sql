-- Migration: Add auth fields and improve users table
BEGIN;

-- Drop password column if it exists and rename to password_hash
ALTER TABLE users 
  RENAME COLUMN password TO password_hash;

-- Ensure password_hash is NOT NULL for new users
ALTER TABLE users 
  ALTER COLUMN password_hash SET NOT NULL;

-- Add password_reset_token and password_reset_expiry for future password reset feature
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;

-- Add account_locked flag for security
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

COMMIT;
