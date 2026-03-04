import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tender, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/tender-types";
import { Calendar, MapPin, Building2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  analyzing: "bg-warning/10 text-warning border-warning/20",
  analyzed: "bg-success/10 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const TenderCard = ({ tender }: { tender: Tender }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
      onClick={() => navigate(`/tender/${tender.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight line-clamp-2">{tender.title}</h3>
          <Badge variant="outline" className={statusColors[tender.status]}>
            {STATUS_LABELS[tender.status]}
          </Badge>
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
