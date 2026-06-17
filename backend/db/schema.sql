-- Supabase SQL — Run in Supabase SQL Editor to create required tables
-- Dashboard → SQL Editor → New Query → Paste → Run

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Topics table (populated by seed_pipeline.py)
CREATE TABLE IF NOT EXISTS topics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  full_name            TEXT,
  icon                 TEXT DEFAULT 'scale',
  short_description    TEXT,
  summary              TEXT,
  key_rights           JSONB DEFAULT '[]'::jsonb,
  important_provisions JSONB DEFAULT '[]'::jsonb,
  penalties            JSONB DEFAULT '[]'::jsonb,
  who_can_benefit      JSONB DEFAULT '[]'::jsonb,
  source_url           TEXT,
  audio_url            TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages (session-scoped, no cross-session access)
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role       TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content    TEXT NOT NULL,
  sources    JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session + time lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages(session_id, created_at);

-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Topics: public read, service-role write
CREATE POLICY "topics_public_read" ON topics
  FOR SELECT USING (true);

CREATE POLICY "topics_service_write" ON topics
  FOR ALL USING (auth.role() = 'service_role');

-- Chat messages: allow service role full access (session ID is the isolation mechanism)
CREATE POLICY "chat_service_access" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');
