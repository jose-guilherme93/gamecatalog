-- Migration: add-user-id-to-donations
-- Created at 2026-02-01T12:00:00.000Z

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='donations' AND column_name='user_id') THEN
        ALTER TABLE donations ADD COLUMN user_id UUID REFERENCES "users"(id);
    END IF;
END $$;
