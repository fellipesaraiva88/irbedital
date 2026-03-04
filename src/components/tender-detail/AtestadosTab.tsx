import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, AlertTriangle, CheckCircle2, User, Building2 } from "lucide-react";
import { Tender } from "@/lib/tender-types";

interface Atestado {
  descricao: string;
  quantidade: string;
  especialidade: string;
  tipo: string;
  obrigatorio: boolean;
}

interface Props {
  tender: Tender;
}

const AtestadosTab = ({ tender }: Props) => {
  const insights = tender.ai_insights as Record<string, any> | null;
  const atestados: Atestado[] = insights?.atestados_tecnicos || [];
  const totalAtestados = insights?.total_atestados ?? atestados.length;
  const complexidade = insights?.complexidade_atestados ?? "—";
  const obrigatorios = atestados.filter((a) => a.obrigatorio).length;

  if (atestados.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center">
          <Award className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum atestado técnico identificado neste edital.</p>
        </CardContent>
      </Card>
    );
  }

  const complexidadeColor = complexidade === "alta" ? "text-destructive" : complexidade === "média" ? "text-warning" : "text-success";

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-display font-bold">{totalAtestados}</div>
            <div className="text-xs text-muted-foreground">Total exigidos</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-display font-bold text-destructive">{obrigatorios}</div>
            <div className="text-xs text-muted-foreground">Obrigatórios</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-display font-bold ${complexidadeColor}`}>{complexidade}</div>
            <div className="text-xs text-muted-foreground">Complexidade</div>
          </CardContent>
        </Card>
      </div>

      {/* Atestado list */}
      <div className="space-y-3">
        {atestados.map((atestado, i) => (
          <Card key={i} className={`border-border/50 ${atestado.obrigatorio ? "border-l-4 border-l-destructive" : "border-l-4 border-l-muted"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {atestado.obrigatorio ? (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{atestado.descricao}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    <Badge variant="outline" className="text-xs gap-1">
                      {atestado.tipo === "profissional" ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {atestado.tipo}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{atestado.especialidade}</Badge>
                    {atestado.quantidade && (
                      <Badge variant="outline" className="text-xs font-mono">{atestado.quantidade}</Badge>
                    )}
                  </div>
                </div>
                {atestado.obrigatorio && (
                  <Badge variant="destructive" className="shrink-0 text-xs">Obrigatório</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AtestadosTab;
