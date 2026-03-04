import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { ArrowLeftRight, Calendar, DollarSign, MapPin, Building2, AlertTriangle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Compare = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    supabase.from("tenders").select("*").eq("status", "analyzed").order("created_at", { ascending: false }).then(({ data }) => {
      setTenders((data as unknown as Tender[]) || []);
    });
  }, []);

  const left = tenders.find((t) => t.id === leftId);
  const right = tenders.find((t) => t.id === rightId);

  const CompareField = ({ label, icon: Icon, leftVal, rightVal }: { label: string; icon: any; leftVal?: string | null; rightVal?: string | null }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start py-3 border-b border-border/50 last:border-0">
      <p className="text-sm">{leftVal || "—"}</p>
      <div className="flex flex-col items-center gap-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-right">{rightVal || "—"}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Comparar Editais</h1>
          <p className="mt-1 text-muted-foreground">Selecione dois editais analisados para comparar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger><SelectValue placeholder="Selecionar edital A" /></SelectTrigger>
            <SelectContent>
              {tenders.filter((t) => t.id !== rightId).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger><SelectValue placeholder="Selecionar edital B" /></SelectTrigger>
            <SelectContent>
              {tenders.filter((t) => t.id !== leftId).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {left && right ? (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-primary" /> Comparação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 pb-3 border-b border-border mb-2">
                <p className="font-display font-semibold text-sm">{left.title}</p>
                <span />
                <p className="font-display font-semibold text-sm text-right">{right.title}</p>
              </div>
              <CompareField label="Órgão" icon={Building2} leftVal={left.organization} rightVal={right.organization} />
              <CompareField label="Local" icon={MapPin} leftVal={left.location} rightVal={right.location} />
              <CompareField
                label="Valor"
                icon={DollarSign}
                leftVal={left.value_estimate ? `R$ ${Number(left.value_estimate).toLocaleString("pt-BR")}` : null}
                rightVal={right.value_estimate ? `R$ ${Number(right.value_estimate).toLocaleString("pt-BR")}` : null}
              />
              <CompareField
                label="Prazo"
                icon={Calendar}
                leftVal={left.deadline ? format(new Date(left.deadline), "dd/MM/yyyy", { locale: ptBR }) : null}
                rightVal={right.deadline ? format(new Date(right.deadline), "dd/MM/yyyy", { locale: ptBR }) : null}
              />
              <CompareField label="Categoria" icon={ArrowLeftRight} leftVal={CATEGORY_LABELS[left.category]} rightVal={CATEGORY_LABELS[right.category]} />
              <CompareField
                label="Riscos"
                icon={AlertTriangle}
                leftVal={(left.ai_insights as any)?.risks}
                rightVal={(right.ai_insights as any)?.risks}
              />
              <CompareField
                label="Oportunidades"
                icon={Lightbulb}
                leftVal={(left.ai_insights as any)?.opportunities}
                rightVal={(right.ai_insights as any)?.opportunities}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Selecione dois editais acima para comparar</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Compare;
