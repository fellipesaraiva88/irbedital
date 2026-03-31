import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { Calendar, MapPin, Building2, DollarSign, Star, AlertTriangle, TrendingUp, Gauge, Shield, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const risks = insights?.risks as string | null;
  const opportunities = insights?.opportunities as string | null;
  const complexidadeAtestados = insights?.complexidade_atestados ?? null;

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
    ? score >= 70 ? "bg-success/10 border-success/20" : score >= 40 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20"
    : "bg-muted";

  const complexityColor = complexity === "alta" ? "text-destructive" : complexity === "média" ? "text-warning" : "text-success";
  const complexityBg = complexity === "alta" ? "bg-destructive/10" : complexity === "média" ? "bg-warning/10" : "bg-success/10";

  // Deadline warning
  let daysToDeadline: number | null = null;
  if (tender.deadline && tender.status !== "archived") {
    daysToDeadline = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const isAnalyzed = ["analyzed", "em_montagem", "proposta_pronta", "enviado", "resultado"].includes(tender.status);

  // Parse pipe-separated insights into array (max 2 items for card)
  const parseItems = (str: string | null, max = 2): string[] => {
    if (!str) return [];
    return str.split("|").map(s => s.trim()).filter(Boolean).slice(0, max);
  };

  const riskItems = parseItems(risks, 2);
  const oppItems = parseItems(opportunities, 2);

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 animate-fade-in group"
      onClick={() => navigate(`/tender/${tender.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2">{tender.title}</h3>
            {tender.organization && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />
                {tender.organization}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 7 && (
              <Badge variant={daysToDeadline <= 1 ? "destructive" : "outline"} className="text-[10px]">
                {daysToDeadline === 0 ? "Hoje!" : daysToDeadline === 1 ? "Amanhã" : `${daysToDeadline}d`}
              </Badge>
            )}
            <button onClick={toggleFav} className="p-1 rounded-md hover:bg-muted transition-colors">
              <Star className={`h-3.5 w-3.5 ${isFav ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <Badge variant="outline" className={`text-[10px] ${statusColors[tender.status]}`}>
            {STATUS_LABELS[tender.status]}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[tender.category]}</Badge>
          {modality && <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{modality}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-0">
        {/* Value + Deadline row - prominent */}
        <div className="flex items-center gap-3">
          {tender.value_estimate ? (
            <div className="flex items-center gap-1 text-sm font-bold text-foreground">
              <DollarSign className="h-3.5 w-3.5 text-success shrink-0" />
              R$ {Number(tender.value_estimate).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">Valor não informado</span>
          )}
          {tender.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Calendar className="h-3 w-3 shrink-0" />
              {format(new Date(tender.deadline), "dd/MM/yy", { locale: ptBR })}
            </div>
          )}
        </div>

        {/* Score + Atestados + Complexidade - compact metrics */}
        {isAnalyzed && score !== null && (
          <div className="grid grid-cols-3 gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`rounded-lg border ${scoreBg} px-2 py-1.5 text-center`}>
                  <div className={`text-base font-bold font-display ${scoreColor}`}>{score}</div>
                  <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Score</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Pontuação de viabilidade (0-100)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 text-center">
                  <div className="text-base font-bold font-display">{totalAtestados ?? "—"}</div>
                  <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Atestados</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {totalAtestados ? `${totalAtestados} atestados exigidos` : "Sem informação"}
                {complexidadeAtestados && ` • Complexidade: ${complexidadeAtestados}`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`rounded-lg border border-border/50 ${complexityBg} px-2 py-1.5 text-center`}>
                  <div className={`text-[11px] font-bold font-display capitalize ${complexityColor}`}>{complexity ?? "—"}</div>
                  <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Complex.</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Complexidade estimada do edital</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Score bar */}
        {isAnalyzed && score !== null && (
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        )}

        {/* Risks & Opportunities - KEY info */}
        {isAnalyzed && (riskItems.length > 0 || oppItems.length > 0) && (
          <div className="space-y-1.5 pt-0.5">
            {riskItems.length > 0 && (
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {riskItems.map((r, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 text-border">•</span>}
                      <span className="text-destructive/80 font-medium">{r}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {oppItems.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Zap className="h-3 w-3 text-success shrink-0 mt-0.5" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {oppItems.map((o, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 text-border">•</span>}
                      <span className="text-success/80 font-medium">{o}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        {tender.location && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{tender.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderCard;
