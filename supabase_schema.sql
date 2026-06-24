-- ============================================================
-- DataBridge · Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Proyectos: agrupa múltiples sesiones de análisis
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#00d4aa',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones: cada vez que el usuario sube archivos y analiza
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Nueva sesión',
  files        JSONB DEFAULT '[]',       -- [{name, size, status}]
  analysis     JSONB,                    -- resultado del analyzer.py
  backend_sid  TEXT,                     -- session_id del FastAPI
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes: historial del chat por sesión
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sessions_project    ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_session    ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated    ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created    ON messages(created_at ASC);

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sessions_updated
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: por ahora público (agregar auth después)
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON projects  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON sessions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON messages  FOR ALL USING (true) WITH CHECK (true);
