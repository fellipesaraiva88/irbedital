import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import TenderCard from "@/components/TenderCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender, TenderCategory, CATEGORY_LABELS } from "@/lib/tender-types";
import { Search, FileSearch, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenders = async () => {
      const { data } = await supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });
      setTenders((data as unknown as Tender[]) || []);
      setLoading(false);
    };
    fetchTenders();
  }, []);

  const filtered = tenders.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.organization?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: tenders.length,
    analyzed: tenders.filter((t) => t.status === "analyzed").length,
    analyzing: tenders.filter((t) => t.status === "analyzing").length,
    recent: tenders.filter((t) => {
      const d = new Date(t.created_at);
      const week = new Date();
      week.setDate(week.getDate() - 7);
      return d > week;
    }).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Visão geral dos seus editais</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total de Editais", value: stats.total, icon: FileSearch, color: "text-primary" },
            { label: "Analisados", value: stats.analyzed, icon: CheckCircle2, color: "text-success" },
            { label: "Em Análise", value: stats.analyzing, icon: TrendingUp, color: "text-warning" },
            { label: "Esta Semana", value: stats.recent, icon: Clock, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl bg-muted p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar editais..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tender list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileSearch className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-lg font-semibold">Nenhum edital encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Faça upload de um PDF para começar a análise</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TenderCard key={t.id} tender={t} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
