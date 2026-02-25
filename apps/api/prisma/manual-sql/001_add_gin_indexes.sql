-- GIN index for fast tag array filtering
-- Run manually after prisma db push / prisma migrate deploy
CREATE INDEX CONCURRENTLY IF NOT EXISTS blocks_tags_gin_idx
  ON blocks USING GIN (tags);

-- GIN index for full-text search on title + content (English)
-- Powers fast @@ to_tsvector queries (target: <200ms per constitution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS blocks_fts_gin_idx
  ON blocks USING GIN (to_tsvector('english', title || ' ' || content));
