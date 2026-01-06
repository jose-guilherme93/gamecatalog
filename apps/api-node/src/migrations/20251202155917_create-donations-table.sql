-- Migration: create-donations-table
-- Created at 2025-12-02T18:59:17.956Z

CREATE TABLE donations (
    id UUID NOT NULL,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    pix_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pix_payload TEXT,
    qr_code_base64 TEXT,
    description VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    customer_data JSONB NOT NULL,
    abacatepay_customer_id VARCHAR(255)
);

CREATE INDEX idx_pix_payments_external_id ON donations(external_id);
CREATE INDEX idx_pix_payments_status ON donations(status);