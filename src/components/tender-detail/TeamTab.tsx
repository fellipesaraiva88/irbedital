import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender } from "@/lib/tender-types";
import { Users, UserCheck, UserX, Plus } from "lucide-react";
import { toast } from "sonner";

interface TeamAssignment {
  id: string;
  tender_id: string;
  professional_id: string | null;
  position_title: string;
  specialty_required: string | null;
  is_filled: boolean;
  notes: string | null;
}

interface Professional {
  id: string;
  name: string;
  crm: string | null;
  specialty: string | null;
}

const TeamTab = ({ tender }: { tender: Tender }) => {
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [assignRes, profRes] = await Promise.all([
      (supabase as any).from("tender_team_assignments").select("*").eq("tender_id", tender.id).order("created_at"),
      (supabase as any).from("professionals").select("id, name, crm, specialty").order("name"),
    ]);
    setAssignments((assignRes.data as unknown as TeamAssignment[]) || []);
    setProfessionals((profRes.data as unknown as Professional[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tender.id]);

  const generatePositions = async () => {
    const insights = tender.ai_insights as Record<string, any> | null;
    const atestados = insights?.atestados_tecnicos as any[] | undefined;

    if (!atestados || atestados.length === 0) {
      toast.error("Nenhum atestado técnico encontrado para gerar posições");
      return;
    }

    const positions = atestados
      .filter((at: any) => at.tipo === "profissional")
      .map((at: any) => ({
        tender_id: tender.id,
        position_title: at.descricao,
        specialty_required: at.especialidade,
        is_filled: false,
      }));

    if (positions.length === 0) {
      toast.error("Nenhuma posição profissional encontrada nos atestados");
      return;
    }

    const { error } = await (supabase as any).from("tender_team_assignments").insert(positions);
    if (error) {
      toast.error("Erro ao gerar posições");
      return;
    }

    toast.success(`${positions.length} posições geradas`);
    fetchData();
  };

  const assignProfessional = async (assignmentId: string, professionalId: string | null) => {
    const updateData: any = {
      professional_id: professionalId,
      is_filled: !!professionalId,
    };
    await (supabase as any).from("tender_team_assignments").update(updateData).eq("id", assignmentId);
    setAssignments(assignments.map((a) =>
      a.id === assignmentId ? { ...a, professional_id: professionalId, is_filled: !!professionalId } : a
    ));
    toast.success(professionalId ? "Profissional atribuído" : "Posição liberada");
  };

  const filled = assignments.filter((a) => a.is_filled).length;
  const total = assignments.length;
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center space-y-3">
          <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma posição definida.</p>
          <Button variant="outline" size="sm" onClick={generatePositions} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Gerar posições dos atestados
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{filled}/{total} posições preenchidas</span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </CardContent>
      </Card>

      {/* Assignments */}
      {assignments.map((assignment) => {
        const assignedPro = professionals.find((p) => p.id === assignment.professional_id);
        const filteredPros = professionals.filter((p) =>
          !assignment.specialty_required || p.specialty?.toLowerCase().includes(assignment.specialty_required.toLowerCase())
        );

        return (
          <Card key={assignment.id} className={`border-border/50 ${assignment.is_filled ? "" : "border-l-4 border-l-warning"}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {assignment.is_filled ? (
                    <UserCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <UserX className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{assignment.position_title}</p>
                    {assignment.specialty_required && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {assignment.specialty_required}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant={assignment.is_filled ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {assignment.is_filled ? "Preenchida" : "Vaga aberta"}
                </Badge>
              </div>

              <Select
                value={assignment.professional_id || "none"}
                onValueChange={(v) => assignProfessional(assignment.id, v === "none" ? null : v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar profissional..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (vaga aberta)</SelectItem>
                  {(filteredPros.length > 0 ? filteredPros : professionals).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.crm ? ` (CRM: ${p.crm})` : ""}{p.specialty ? ` - ${p.specialty}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamTab;
