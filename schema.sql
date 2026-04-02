-- ============================================================
-- SLA Manager — Supabase Schema
-- Digital Center
-- ============================================================

-- Default values (κοστολόγηση)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES
  ('hourly_rate',    '20'),
  ('km_rate',        '0.3'),
  ('drive_hourly',   '20')
ON CONFLICT (key) DO NOTHING;

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  km          NUMERIC(6,1),
  drive_hours NUMERIC(4,1),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Task types
CREATE TABLE IF NOT EXISTS task_types (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id                BIGSERIAL PRIMARY KEY,
  task_code         TEXT UNIQUE,
  task_date         DATE NOT NULL,
  location_id       BIGINT REFERENCES locations(id),
  location_name     TEXT,               -- denormalized για search
  task_type_id      BIGINT REFERENCES task_types(id),
  task_type_name    TEXT,               -- denormalized
  summary           TEXT,
  task_start        TIME,
  task_end          TIME,
  duration_hours    NUMERIC(5,2) DEFAULT 0,
  drive_km          NUMERIC(7,1) DEFAULT 0,
  drive_hours       NUMERIC(4,1) DEFAULT 0,
  hours_cost        NUMERIC(8,2) DEFAULT 0,
  drive_cost        NUMERIC(8,2) DEFAULT 0,
  duration_cost     NUMERIC(8,2) DEFAULT 0,
  extra_charges     NUMERIC(8,2) DEFAULT 0,
  total_sum         NUMERIC(8,2) DEFAULT 0,
  comment           TEXT,
  status            TEXT DEFAULT 'Done',
  client_id         BIGINT REFERENCES clients(id),
  file_export       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index για γρήγορα φίλτρα
CREATE INDEX IF NOT EXISTS idx_tasks_date     ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks(location_name);
CREATE INDEX IF NOT EXISTS idx_tasks_type     ON tasks(task_type_name);
CREATE INDEX IF NOT EXISTS idx_tasks_client   ON tasks(client_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: allow all for now (single-user app)
ALTER TABLE tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_tasks"      ON tasks      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_locations"  ON locations  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_types"      ON task_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clients"    ON clients    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings"   ON settings   FOR ALL USING (true) WITH CHECK (true);
