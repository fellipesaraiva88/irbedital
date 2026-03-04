-- Extended status flow for tender lifecycle
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'em_montagem' AFTER 'analyzed';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'proposta_pronta' AFTER 'em_montagem';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'enviado' AFTER 'proposta_pronta';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'resultado' AFTER 'enviado';

-- Result column for tenders (won/lost/pending)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('won', 'lost', 'pending'));
