-- Checklist items for tender requirements tracking
CREATE TABLE IF NOT EXISTS tender_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('requirement', 'compliance', 'atestado', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS permissive
ALTER TABLE tender_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tender_checklist_items" ON tender_checklist_items FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_tender_checklist_items_updated_at
  BEFORE UPDATE ON tender_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
