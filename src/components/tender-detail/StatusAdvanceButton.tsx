import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender, TenderStatus, TenderResult, RESULT_LABELS } from "@/lib/tender-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Hammer, CheckCircle2, Send, Trophy } from "lucide-react";

interface Props {
  tender: Tender;
  onStatusChange: (status: TenderStatus, result?: TenderResult) => void;
  onGenerateChecklist?: () => Promise<void>;
}

const statusActions: Record<string, { label: string; next: TenderStatus; icon: React.ElementType }> = {
  analyzed: { label: "Iniciar Montagem", next: "em_montagem", icon: Hammer },
  em_montagem: { label: "Marcar Proposta Pronta", next: "proposta_pronta", icon: CheckCircle2 },
  proposta_pronta: { label: "Marcar como Enviado", next: "enviado", icon: Send },
  enviado: { label: "Registrar Resultado", next: "resultado", icon: Trophy },
};

const StatusAdvanceButton = ({ tender, onStatusChange, onGenerateChecklist }: Props) => {
  const [loading, setLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TenderResult>("pending");

  const action = statusActions[tender.status];
  if (!action) return null;

  const handleAdvance = async () => {
    if (tender.status === "enviado") {
      setShowResultDialog(true);
      return;
    }

    setLoading(true);
    try {
      await supabase.from("tenders").update({ status: action.next } as any).eq("id", tender.id);

      if (tender.status === "analyzed" && onGenerateChecklist) {
        await onGenerateChecklist();
      }

      onStatusChange(action.next);
      toast.success(`Status atualizado para "${action.next === "em_montagem" ? "Em Montagem" : action.next === "proposta_pronta" ? "Proposta Pronta" : "Enviado"}"`);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  const handleResultSubmit = async () => {
    setLoading(true);
    try {
      await supabase.from("tenders").update({ status: "resultado" as any, result: selectedResult } as any).eq("id", tender.id);
      onStatusChange("resultado", selectedResult);
      setShowResultDialog(false);
      toast.success(`Resultado registrado: ${RESULT_LABELS[selectedResult]}`);
    } catch {
      toast.error("Erro ao registrar resultado");
    } finally {
      setLoading(false);
    }
  };

  const Icon = action.icon;

  return (
    <>
      <Button onClick={handleAdvance} disabled={loading} size="sm" className="gap-1.5">
        <Icon className="h-4 w-4" />
        {action.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedResult} onValueChange={(v) => setSelectedResult(v as TenderResult)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESULT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>Cancelar</Button>
            <Button onClick={handleResultSubmit} disabled={loading}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StatusAdvanceButton;
