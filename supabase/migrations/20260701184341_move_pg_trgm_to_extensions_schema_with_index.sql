DROP INDEX IF EXISTS paint_colors_search_trgm_idx;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE INDEX paint_colors_search_trgm_idx ON paint_colors USING gin (search_text extensions.gin_trgm_ops);