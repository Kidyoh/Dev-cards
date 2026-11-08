-- Rendered share images (PNG bytes), stored once globally so they aren't re-rendered per data center.
CREATE TABLE IF NOT EXISTS images (
  key        TEXT PRIMARY KEY,   -- "<format>:<login>"
  version    TEXT NOT NULL,      -- card.generatedAt the image was drawn from
  png        BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
