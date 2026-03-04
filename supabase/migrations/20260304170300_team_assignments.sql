-- Team assignments for matching professionals to tender positions
CREATE TABLE IF NOT EXISTS tender_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  position_title TEXT NOT NULL,
  specialty_required TEXT,
  is_filled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS permissive
ALTER TABLE tender_team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tender_team_assignments" ON tender_team_assignments FOR ALL USING (true) WITH CHECK (true);
