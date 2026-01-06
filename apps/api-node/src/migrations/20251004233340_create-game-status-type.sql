-- Migration: create-game-status-type
-- Created at 2025-10-05T02:33:40.064Z

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'game_status'
    ) THEN
        CREATE TYPE game_status AS ENUM ('Jogando', 'Zerado', 'Quero jogar', 'Abandonado');
    END IF;
END
$$;
