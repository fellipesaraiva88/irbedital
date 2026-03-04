import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { ArrowLeft, Calendar, MapPin, Building2, DollarSign, FileText, Sparkles, ListChecks, AlertTriangle, Lightbulb, ClipboardCheck, Clock, Shield, Download, Star, MessageSquare, Archive } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { exportTenderPDF } from "@/lib/export-pdf";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  analyzing: "bg-warning/10 text-warning border-warning/20",
  analyzed: "bg-success/10 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const TenderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTender = async () => {
    const { data } = await supabase.from("tenders").select("*").eq("id", id!).single();
    setTender(data as unknown as Tender);
    setLoading(false);
  };

  useEffect(() => {
    fetchTender();
    const interval = setInterval(async () => {
      const { data } = await supabase.from("tenders").select("status").eq("id", id!).single();
      if (data && (data as any).status === "analyzed") {
        fetchTender();
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const toggleFavorite = async () => {
    if (!tender) return;
    const newVal = !(tender as any).is_favorite;
    await supabase.from("tenders").update({ is_favorite: newVal } as any).eq("id", tender.id);
    setTender({ ...tender, is_favorite: newVal } as any);
    toast.success(newVal ? "Adicionado aos favoritos" : "Removido dos favoritos");
  };

  const toggleArchive = async () => {
    if (!tender) return;
    const newStatus = tender.status === "archived" ? "analyzed" : "archived";
    await supabase.from("tenders").update({ status: newStatus } as any).eq("id", tender.id);
    setTender({ ...tender, status: newStatus as any });
    toast.success(newStatus === "archived" ? "Edital arquivado" : "Edital desarquivado");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tender) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Edital não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  const insights = tender.ai_insights as Record<string, any> | null;
  const isFav = (tender as any).is_favorite;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={toggleFavorite} className="gap-1.5">
            <Star className={`h-4 w-4 ${isFav ? "fill-warning text-warning" : ""}`} />
            {isFav ? "Favorito" : "Favoritar"}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleArchive} className="gap-1.5">
            <Archive className="h-4 w-4" />
            {tender.status === "archived" ? "Desarquivar" : "Arquivar"}
          </Button>
          {tender.status === "analyzed" && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/tender/${id}/chat`)} className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Chat IA
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportTenderPDF(tender)} className="gap-1.5">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </>
          )}
        </div>

        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-2xl font-bold tracking-tight leading-tight">{tender.title}</h1>
            <Badge variant="outline" className={`${statusColors[tender.status]} shrink-0`}>
              {STATUS_LABELS[tender.status]}
            </Badge>
          </div>
          {tender.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tender.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[tender.category]}</Badge>
            {insights?.modality && <Badge variant="outline">{insights.modality}</Badge>}
            {insights?.estimated_complexity && (
              <Badge variant={insights.estimated_complexity === "alta" ? "destructive" : "secondary"}>
                Complexidade: {insights.estimated_complexity}
              </Badge>
            )}
          </div>
        </div>

        {/* Analyzing state */}
        {tender.status === "analyzing" && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-warning" />
              <div>
                <p className="font-display font-semibold">Análise em andamento...</p>
                <p className="text-sm text-muted-foreground">A IA está processando. Atualização automática.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tender.organization && <div className="flex items-start gap-3"><span className="text-muted-foreground w-20 shrink-0">Órgão</span><span className="font-medium">{tender.organization}</span></div>}
              {tender.location && <div className="flex items-start gap-3"><span className="text-muted-foreground w-20 shrink-0">Local</span><span className="font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tender.location}</span></div>}
              {tender.value_estimate && <div className="flex items-start gap-3"><span className="text-muted-foreground w-20 shrink-0">Valor</span><span className="font-bold text-success flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />R$ {Number(tender.value_estimate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
              {tender.deadline && <div className="flex items-start gap-3"><span className="text-muted-foreground w-20 shrink-0">Prazo</span><span className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(tender.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></div>}
              {tender.file_name && <div className="flex items-start gap-3"><span className="text-muted-foreground w-20 shrink-0">Arquivo</span><span className="font-medium flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{tender.file_name}</span></div>}
            </CardContent>
          </Card>

          {tender.contact_info && Object.values(tender.contact_info).some(v => v) && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">📞 Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(tender.contact_info as any).responsible && <div><span className="text-muted-foreground">Responsável:</span> <span className="font-medium">{(tender.contact_info as any).responsible}</span></div>}
                {(tender.contact_info as any).email && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{(tender.contact_info as any).email}</span></div>}
                {(tender.contact_info as any).phone && <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{(tender.contact_info as any).phone}</span></div>}
                {(tender.contact_info as any).address && <div><span className="text-muted-foreground">Endereço:</span> <span className="font-medium">{(tender.contact_info as any).address}</span></div>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Requirements */}
        {tender.requirements && tender.requirements.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Requisitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {tender.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        {tender.ai_summary && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Resumo Executivo — IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{tender.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Dates */}
        {insights?.key_dates && insights.key_dates.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.key_dates.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="shrink-0 font-mono text-xs">
                      {d.date ? format(new Date(d.date), "dd/MM/yyyy") : "—"}
                    </Badge>
                    <span>{d.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        {insights && (
          <div className="grid gap-4">
            {insights.risks && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Riscos
                  </CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{insights.risks}</p></CardContent>
              </Card>
            )}
            {insights.opportunities && (
              <Card className="border-success/20 bg-success/5">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2 text-success">
                    <Lightbulb className="h-4 w-4" /> Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{insights.opportunities}</p></CardContent>
              </Card>
            )}
            {insights.recommendations && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2 text-primary">
                    <ClipboardCheck className="h-4 w-4" /> Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{insights.recommendations}</p></CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Compliance */}
        {insights?.compliance_checklist && insights.compliance_checklist.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {insights.compliance_checklist.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded border border-border flex items-center justify-center text-xs text-muted-foreground">{i + 1}</div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TenderDetail;
