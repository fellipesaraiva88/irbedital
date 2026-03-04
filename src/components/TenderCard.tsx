import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { Calendar, MapPin, Building2, DollarSign, Star } from "lucide-react";
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
  const isFav = (tender as any).is_favorite;

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("tenders").update({ is_favorite: !isFav } as any).eq("id", tender.id);
    toast.success(isFav ? "Removido dos favoritos" : "Adicionado aos favoritos");
    onUpdate?.();
  };

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

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
      onClick={() => navigate(`/tender/${tender.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight line-clamp-2 flex-1">{tender.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {deadlineBadge}
            <button onClick={toggleFav} className="p-1 rounded-md hover:bg-muted transition-colors">
              <Star className={`h-4 w-4 ${isFav ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
            </button>
            <Badge variant="outline" className={statusColors[tender.status]}>
              {STATUS_LABELS[tender.status]}
            </Badge>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">{CATEGORY_LABELS[tender.category]}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {tender.organization && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{tender.organization}</span>
          </div>
        )}
        {tender.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{tender.location}</span>
          </div>
        )}
        {tender.value_estimate && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>R$ {Number(tender.value_estimate).toLocaleString("pt-BR")}</span>
          </div>
        )}
        {tender.deadline && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(tender.deadline), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderCard;
