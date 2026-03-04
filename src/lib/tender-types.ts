export type TenderStatus = 'new' | 'analyzing' | 'analyzed' | 'archived';
export type TenderCategory = 'obras' | 'servicos' | 'compras' | 'tecnologia' | 'saude' | 'educacao' | 'outros';

export interface Tender {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  organization: string | null;
  category: TenderCategory;
  status: TenderStatus;
  value_estimate: number | null;
  deadline: string | null;
  location: string | null;
  requirements: string[] | null;
  contact_info: Record<string, unknown> | null;
  source_url: string | null;
  file_name: string | null;
  file_path: string | null;
  ai_summary: string | null;
  ai_insights: Record<string, unknown> | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<TenderCategory, string> = {
  obras: 'Obras',
  servicos: 'Serviços',
  compras: 'Compras',
  tecnologia: 'Tecnologia',
  saude: 'Saúde',
  educacao: 'Educação',
  outros: 'Outros',
};

export const STATUS_LABELS: Record<TenderStatus, string> = {
  new: 'Novo',
  analyzing: 'Analisando',
  analyzed: 'Analisado',
  archived: 'Arquivado',
};
