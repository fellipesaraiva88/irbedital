import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lightbulb, ClipboardCheck, Clock, Shield } from "lucide-react";
import { format } from "date-fns";
import { Tender } from "@/lib/tender-types";

interface Props {
  tender: Tender;
}

const splitItems = (text: string | undefined): string[] => {
  if (!text) return [];
  return text.split("|").map((s) => s.trim()).filter(Boolean);
};

const InsightsTab = ({ tender }: Props) => {
  const insights = tender.ai_insights as Record<string, any> | null;
  if (!insights) return null;

  const risks = splitItems(insights.risks);
  const opportunities = splitItems(insights.opportunities);
  const recommendations = splitItems(insights.recommendations);
  const checklist = insights.compliance_checklist || [];
  const keyDates = insights.key_dates || [];

  return (
    <div className="space-y-4">
      {/* Risks & Opportunities side by side */}
      <div className="grid gap-3 md:grid-cols-2">
        {risks.length > 0 && (
          <Card className="border-destructive/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-display font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" /> Riscos
              </div>
              {risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {opportunities.length > 0 && (
          <Card className="border-success/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-success font-display font-semibold text-sm">
                <Lightbulb className="h-4 w-4" /> Oportunidades
              </div>
              {opportunities.map((o, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success/60 shrink-0" />
                  <span>{o}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-display font-semibold text-sm">
              <ClipboardCheck className="h-4 w-4" /> Recomendações
            </div>
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key dates */}
      {keyDates.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <Clock className="h-4 w-4 text-primary" /> Datas
            </div>
            <div className="flex flex-wrap gap-2">
              {keyDates.map((d: any, i: number) => (
                <Badge key={i} variant="outline" className="gap-1.5 font-normal">
                  <span className="font-mono text-xs">{d.date ? format(new Date(d.date), "dd/MM") : "—"}</span>
                  {d.description}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <Shield className="h-4 w-4 text-primary" /> Checklist
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {checklist.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded border border-border flex items-center justify-center text-[10px] text-muted-foreground shrink-0">{i + 1}</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsTab;
