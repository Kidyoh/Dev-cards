-- Every card that has been scanned. Doubles as the 6-hour cache and the leaderboard source.
CREATE TABLE IF NOT EXISTS cards (
  login        TEXT PRIMARY KEY,          -- lowercase GitHub login
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  country      TEXT,                      -- normalised from the free-text GitHub location, or NULL
  top_language TEXT,
  overall      INTEGER NOT NULL,
  rarity       TEXT NOT NULL,
  shp INTEGER NOT NULL, con INTEGER NOT NULL, rng INTEGER NOT NULL,
  dep INTEGER NOT NULL, imp INTEGER NOT NULL, col INTEGER NOT NULL,
  data         TEXT NOT NULL,             -- full CardData JSON
  scanned_at   INTEGER NOT NULL           -- epoch ms
);
CREATE INDEX IF NOT EXISTS cards_overall ON cards (overall DESC);
CREATE INDEX IF NOT EXISTS cards_country_overall ON cards (country, overall DESC);
CREATE INDEX IF NOT EXISTS cards_language_overall ON cards (top_language, overall DESC);

-- Cached "most-followed on GitHub" boards, used to seed a board nobody has scanned into yet.
CREATE TABLE IF NOT EXISTS boards (
  key        TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
