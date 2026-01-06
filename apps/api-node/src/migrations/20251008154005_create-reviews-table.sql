-- Migration: create-reviews-table
-- Created at 2025-10-08T18:40:05.651Z

CREATE TABLE IF NOT EXISTS "reviews"(
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, user_id),
    review_text VARCHAR(5000),
    score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL

);