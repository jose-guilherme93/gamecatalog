-- Migration: unique-slug-game-table
-- Created at 2025-12-23T18:35:33.517Z

ALTER TABLE "games" ADD CONSTRAINT unique_game_slug UNIQUE (slug)