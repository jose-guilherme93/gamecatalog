-- Migration: create_donation_status_history
-- Created at 2026-02-12T16:25:00.000Z

-- Ensure donations has a primary key so it can be referenced
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='donations' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE donations ADD PRIMARY KEY (id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS donation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_history_donation_id ON donation_status_history(donation_id);
