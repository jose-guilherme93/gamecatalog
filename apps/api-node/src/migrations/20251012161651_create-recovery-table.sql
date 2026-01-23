-- Migration: create-recovery-table
-- Created at 2025-10-12T19:16:51.185Z

CREATE TABLE recovery (
    id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    code VARCHAR NULL DEFAULT NULL,
    expires_at TIMESTAMPTZ NULL DEFAULT NULL,
    attempts INT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
