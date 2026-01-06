-- Migration: create-game-table
-- Created at 2025-10-05T02:33:57.126Z

CREATE TABLE IF NOT EXISTS "games"(
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    status game_status,
    review VARCHAR(5000),
    plataform VARCHAR(100),
    first_release_date TIMESTAMP,
    storyline VARCHAR(5000),
    cover_url VARCHAR(500),
    slug VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
    );