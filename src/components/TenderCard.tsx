import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { Calendar, MapPin, Building2, DollarSign, Star, Award, TrendingUp, Gauge } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  analyzing: "bg-warning/10 text-warning border-warning/20",
  analyzed: "bg-success/10 text-success border-success/20",
  em_montagem: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  proposta_pronta: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  enviado: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  resultado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const TenderCard = ({ tender, onUpdate }: { tender: Tender; onUpdate?: () => void }) => {
  const navigate = useNavigate();
  const isFav = tender.is_favorite;
  const insights = tender.ai_insights as Record<string, any> | null;
  const score = insights?.score ?? null;
  const totalAtestados = insights?.total_atestados ?? null;
  const complexity = insights?.estimated_complexity ?? null;
  const modality = insights?.modality ?? null;

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("tenders").update({ is_favorite: !isFav } as any).eq("id", tender.id);
    toast.success(isFav ? "Removido dos favoritos" : "Adicionado aos favoritos");
    onUpdate?.();
  };

  const scoreColor = score !== null
    ? score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive"
    : "text-muted-foreground";

  const scoreBg = score !== null
    ? score >= 70 ? "bg-success/10" : score >= 40 ? "bg-warning/10" : "bg-destructive/10"
    : "bg-muted";

  const complexityColor = complexity === "alta" ? "text-destructive" : complexity === "média" ? "text-warning" : "text-success";

  // Deadline warning
  let deadlineBadge = null;
  if (tender.deadline && tender.status !== "archived") {
    const days = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days >= 0 && days <= 7) {
      deadlineBadge = (
        <Badge variant={days <= 1 ? "destructive" : "outline"} className="text-[10px]">
          {days === 0 ? "Hoje!" : days === 1 ? "Amanhã" : `${days}d`}
        </Badge>
      );
    }
  }

  const isAnalyzed = ["analyzed", "em_montagem", "proposta_pronta", "enviado", "resultado"].includes(tender.status);

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
      onClick={() => navigate(`/tender/${tender.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2 flex-1">{tender.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {deadlineBadge}
            <button onClick={toggleFav} className="p-1 rounded-md hover:bg-muted transition-colors">
              <Star className={`h-3.5 w-3.5 ${isFav ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${statusColors[tender.status]}`}>
            {STATUS_LABELS[tender.status]}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[tender.category]}</Badge>
          {modality && <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{modality}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Key numbers row */}
        {isAnalyzed && score !== null && (
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-lg ${scoreBg} p-2 text-center`}>
              <div className={`text-lg font-bold font-display ${scoreColor}`}>{score}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Score</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <div className="text-lg font-bold font-display">{totalAtestados ?? "—"}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Atestados</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <div className={`text-xs font-bold font-display capitalize ${complexityColor}`}>{complexity ?? "—"}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mt-1">Complexidade</div>
            </div>
          </div>
        )}

        {/* Score bar */}
        {isAnalyzed && score !== null && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        )}

        {/* Meta info - compact */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {tender.value_estimate && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 shrink-0" />
              <span className="font-semibold text-foreground">R$ {Number(tender.value_estimate).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {tender.deadline && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{format(new Date(tender.deadline), "dd/MM/yy", { locale: ptBR })}</span>
            </div>
          )}
          {tender.organization && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{tender.organization}</span>
            </div>
          )}
          {tender.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{tender.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderCard;
