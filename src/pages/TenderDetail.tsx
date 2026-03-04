import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { ArrowLeft, Calendar, MapPin, Building2, DollarSign, FileText, Sparkles, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("tenders").select("*").eq("id", id!).single();
      setTender(data as unknown as Tender);
      setLoading(false);
    };
    fetch();
  }, [id]);

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

  const insights = tender.ai_insights as Record<string, unknown> | null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{tender.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className={statusColors[tender.status]}>{STATUS_LABELS[tender.status]}</Badge>
              <Badge variant="secondary">{CATEGORY_LABELS[tender.category]}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Info Card */}
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-display text-base">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tender.organization && (
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{tender.organization}</span></div>
              )}
              {tender.location && (
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{tender.location}</span></div>
              )}
              {tender.value_estimate && (
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>R$ {Number(tender.value_estimate).toLocaleString("pt-BR")}</span></div>
              )}
              {tender.deadline && (
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(tender.deadline), "dd/MM/yyyy", { locale: ptBR })}</span></div>
              )}
              {tender.file_name && (
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span>{tender.file_name}</span></div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          {tender.requirements && tender.requirements.length > 0 && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Requisitos</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {tender.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Summary */}
        {tender.ai_summary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Resumo da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{tender.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        {insights && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {insights.risks && (
                  <div>
                    <p className="font-semibold text-destructive mb-1">⚠️ Riscos</p>
                    <p className="text-muted-foreground">{String(insights.risks)}</p>
                  </div>
                )}
                {insights.opportunities && (
                  <div>
                    <p className="font-semibold text-success mb-1">💡 Oportunidades</p>
                    <p className="text-muted-foreground">{String(insights.opportunities)}</p>
                  </div>
                )}
                {insights.recommendations && (
                  <div>
                    <p className="font-semibold text-primary mb-1">📋 Recomendações</p>
                    <p className="text-muted-foreground">{String(insights.recommendations)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TenderDetail;
