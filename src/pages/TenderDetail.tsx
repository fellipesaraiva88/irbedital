import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tender } from "@/lib/tender-types";
import { Sparkles, ListChecks, Award, BarChart3, FileText } from "lucide-react";
import { toast } from "sonner";
import TenderHeader from "@/components/tender-detail/TenderHeader";
import ScoreCard from "@/components/tender-detail/ScoreCard";
import AtestadosTab from "@/components/tender-detail/AtestadosTab";
import InsightsTab from "@/components/tender-detail/InsightsTab";

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
    toast.success(newVal ? "Favoritado" : "Removido");
  };

  const toggleArchive = async () => {
    if (!tender) return;
    const newStatus = tender.status === "archived" ? "analyzed" : "archived";
    await supabase.from("tenders").update({ status: newStatus } as any).eq("id", tender.id);
    setTender({ ...tender, status: newStatus as any });
    toast.success(newStatus === "archived" ? "Arquivado" : "Desarquivado");
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
  const requirements = tender.requirements || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl">
        <TenderHeader tender={tender} isFav={isFav} onToggleFavorite={toggleFavorite} onToggleArchive={toggleArchive} />

        {/* Analyzing state */}
        {tender.status === "analyzing" && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-warning" />
              <div>
                <p className="font-display font-semibold text-sm">Analisando...</p>
                <p className="text-xs text-muted-foreground">Atualização automática.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score + Metrics */}
        {tender.status === "analyzed" && <ScoreCard tender={tender} />}

        {/* Summary - concise */}
        {tender.ai_summary && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{tender.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {tender.status === "analyzed" && (
          <Tabs defaultValue="atestados" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="atestados" className="gap-1.5 text-xs">
                <Award className="h-3.5 w-3.5" /> Atestados
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Insights
              </TabsTrigger>
              <TabsTrigger value="requisitos" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" /> Requisitos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="atestados" className="mt-4">
              <AtestadosTab tender={tender} />
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <InsightsTab tender={tender} />
            </TabsContent>

            <TabsContent value="requisitos" className="mt-4">
              {requirements.length > 0 ? (
                <div className="space-y-2">
                  {requirements.map((r, i) => (
                    <Card key={i} className="border-border/50">
                      <CardContent className="p-3 flex items-start gap-3">
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-semibold shrink-0">{i + 1}</span>
                        <span className="text-sm">{r}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum requisito identificado.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TenderDetail;
