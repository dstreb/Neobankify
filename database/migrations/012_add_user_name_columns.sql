-- Migration 012: Add first_name and last_name columns to users table
-- Required for: Register endpoint stores user names, GET /users/me returns them

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
