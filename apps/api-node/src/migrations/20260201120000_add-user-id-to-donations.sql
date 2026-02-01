-- Migration: add-user-id-to-donations
-- Created at 2026-02-01T12:00:00.000Z

ALTER TABLE donations ADD COLUMN user_id UUID REFERENCES users(id);
