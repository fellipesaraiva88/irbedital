import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Calendar, MapPin, Building2, TrendingUp, Shield, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tender } from "@/lib/tender-types";

interface Props {
  tender: Tender;
}

const ScoreCard = ({ tender }: Props) => {
  const insights = tender.ai_insights as Record<string, any> | null;
  const score = insights?.score ?? null;
  const complexity = insights?.estimated_complexity ?? "—";
  const totalAtestados = insights?.total_atestados ?? 0;
  const complexidadeAtestados = insights?.complexidade_atestados ?? "—";

  const scoreColor = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  const scoreBarColor = score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive";

  const metrics = [
    { icon: Building2, label: "Órgão", value: tender.organization || "—" },
    { icon: MapPin, label: "Local", value: tender.location || "—" },
    { icon: DollarSign, label: "Valor", value: tender.value_estimate ? `R$ ${Number(tender.value_estimate).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "—" },
    { icon: Calendar, label: "Prazo", value: tender.deadline ? format(new Date(tender.deadline), "dd/MM/yyyy", { locale: ptBR }) : "—" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-6">
      {/* Score */}
      <Card className="md:col-span-2 border-border/50">
        <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className={`text-4xl font-display font-bold ${scoreColor}`}>
              {score !== null ? score : "—"}
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</div>
          {score !== null && (
            <div className="w-full">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${scoreBarColor}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {complexity}</span>
            <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {totalAtestados} atestados</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick metrics */}
      <div className="md:col-span-4 grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <m.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</div>
                <div className="text-sm font-semibold truncate">{m.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;
