-- Pool of professionals for team matching
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  crm TEXT,
  specialty TEXT,
  availability TEXT,
  source_file TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS permissive
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on professionals" ON professionals FOR ALL USING (true) WITH CHECK (true);
