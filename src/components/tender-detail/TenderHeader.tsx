import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { ArrowLeft, Star, Archive, MessageSquare, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportTenderPDF } from "@/lib/export-pdf";

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

interface Props {
  tender: Tender;
  isFav: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
}

const TenderHeader = ({ tender, isFav, onToggleFavorite, onToggleArchive }: Props) => {
  const navigate = useNavigate();
  const insights = tender.ai_insights as Record<string, any> | null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onToggleFavorite} className="gap-1.5">
          <Star className={`h-4 w-4 ${isFav ? "fill-warning text-warning" : ""}`} />
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleArchive} className="gap-1.5">
          <Archive className="h-4 w-4" />
        </Button>
        {tender.status !== "new" && tender.status !== "analyzing" && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/tender/${tender.id}/chat`)} className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportTenderPDF(tender)} className="gap-1.5">
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold tracking-tight leading-tight">{tender.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusColors[tender.status]}>{STATUS_LABELS[tender.status]}</Badge>
            <Badge variant="secondary">{CATEGORY_LABELS[tender.category]}</Badge>
            {insights?.modality && <Badge variant="outline">{insights.modality}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderHeader;
