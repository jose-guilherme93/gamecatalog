-- Migration: alter-table-game
-- Created at 2025-12-23T18:44:07.492Z

-- Aumentando o limite da coluna plataform 
ALTER TABLE "games" ALTER COLUMN plataform TYPE VARCHAR(500);

-- Aproveitando para garantir que storyline e cover_url não quebrem no futuro
ALTER TABLE "games" ALTER COLUMN cover_url TYPE VARCHAR(1000);
ALTER TABLE "games" ALTER COLUMN storyline TYPE TEXT;