import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tender, STATUS_LABELS, CATEGORY_LABELS } from "@/lib/tender-types";
import { FileText, Upload, CheckCircle2, Archive, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const statusIcons: Record<string, any> = {
  new: Upload,
  analyzing: Clock,
  analyzed: CheckCircle2,
  archived: Archive,
};

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  analyzing: "bg-warning/10 text-warning",
  analyzed: "bg-success/10 text-success",
  archived: "bg-muted text-muted-foreground",
};

const History = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("tenders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTenders((data as unknown as Tender[]) || []);
    });
  }, []);

  // Group by date
  const grouped = tenders.reduce<Record<string, Tender[]>>((acc, t) => {
    const day = format(new Date(t.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    (acc[day] ||= []).push(t);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="mt-1 text-muted-foreground">Timeline de todos os uploads e análises</p>
        </div>

        {Object.entries(grouped).length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Nenhum edital encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{date}</p>
                <div className="space-y-2 relative before:absolute before:left-[19px] before:top-0 before:bottom-0 before:w-px before:bg-border">
                  {items.map((t) => {
                    const Icon = statusIcons[t.status] || FileText;
                    return (
                      <Card
                        key={t.id}
                        className="ml-10 cursor-pointer border-border/50 transition-all hover:shadow-sm hover:border-primary/30"
                        onClick={() => navigate(`/tender/${t.id}`)}
                      >
                        <CardContent className="flex items-center gap-3 py-3 px-4">
                          <div className={`absolute -left-[1px] h-10 w-10 rounded-full flex items-center justify-center ${statusColors[t.status]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(t.created_at), "HH:mm", { locale: ptBR })} · {CATEGORY_LABELS[t.category]}
                              {t.file_name && ` · ${t.file_name}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {STATUS_LABELS[t.status]}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
