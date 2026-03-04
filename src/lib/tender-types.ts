export type TenderStatus = 'new' | 'analyzing' | 'analyzed' | 'em_montagem' | 'proposta_pronta' | 'enviado' | 'resultado' | 'archived';
export type TenderCategory = 'obras' | 'servicos' | 'compras' | 'tecnologia' | 'saude' | 'educacao' | 'outros';
export type TenderResult = 'won' | 'lost' | 'pending';

export interface Tender {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  organization: string | null;
  category: TenderCategory;
  status: TenderStatus;
  result: TenderResult | null;
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
  is_favorite: boolean;
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
  em_montagem: 'Em Montagem',
  proposta_pronta: 'Proposta Pronta',
  enviado: 'Enviado',
  resultado: 'Resultado',
  archived: 'Arquivado',
};

export const RESULT_LABELS: Record<TenderResult, string> = {
  won: 'Ganhou',
  lost: 'Perdeu',
  pending: 'Pendente',
};

export const STATUS_ORDER: TenderStatus[] = [
  'new', 'analyzing', 'analyzed', 'em_montagem', 'proposta_pronta', 'enviado', 'resultado', 'archived'
];
