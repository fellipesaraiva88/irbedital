import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import TenderCard from "@/components/TenderCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender, TenderCategory, CATEGORY_LABELS, STATUS_LABELS, TenderStatus } from "@/lib/tender-types";
import { Search, FileSearch, TrendingUp, Clock, CheckCircle2, AlertTriangle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const CHART_COLORS = ["hsl(230,80%,56%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,55%)", "hsl(280,60%,55%)", "hsl(200,70%,50%)", "hsl(320,60%,50%)"];

const Index = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTenders = async () => {
    const { data } = await supabase.from("tenders").select("*").order("created_at", { ascending: false });
    setTenders((data as unknown as Tender[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTenders(); }, []);

  const filtered = tenders
    .filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.organization?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesFav = !showFavorites || (t as any).is_favorite;
      return matchesSearch && matchesCategory && matchesStatus && matchesFav;
    })
    .sort((a, b) => {
      if (sortBy === "value") return (Number(b.value_estimate) || 0) - (Number(a.value_estimate) || 0);
      if (sortBy === "deadline") return (a.deadline || "z").localeCompare(b.deadline || "z");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  // Deadline alerts
  const deadlineAlerts = tenders.filter((t) => {
    if (!t.deadline || t.status === "archived") return false;
    const diff = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  // Chart data
  const categoryData = Object.entries(
    tenders.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value], i) => ({ name: CATEGORY_LABELS[name as TenderCategory] || name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  const statusData = Object.entries(
    tenders.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value], i) => ({ name: STATUS_LABELS[name as TenderStatus] || name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Visão geral dos seus editais</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileSearch, color: "text-primary" },
            { label: "Analisados", value: stats.analyzed, icon: CheckCircle2, color: "text-success" },
            { label: "Em Análise", value: stats.analyzing, icon: TrendingUp, color: "text-warning" },
            { label: "Esta Semana", value: stats.recent, icon: Clock, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-xl bg-muted p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold font-display">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deadline Alerts */}
        {deadlineAlerts.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" /> Prazos Próximos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlineAlerts.map((t) => {
                const days = Math.ceil((new Date(t.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 font-medium">{t.title}</span>
                    <Badge variant={days <= 1 ? "destructive" : days <= 3 ? "outline" : "secondary"} className="ml-2 shrink-0">
                      {days === 0 ? "Hoje!" : days === 1 ? "Amanhã" : `${days} dias`}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        {tenders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                      {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm">Por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar editais..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recente</SelectItem>
              <SelectItem value="value">Maior valor</SelectItem>
              <SelectItem value="deadline">Prazo mais próximo</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${showFavorites ? "border-warning bg-warning/10 text-warning" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}
          >
            <Star className={`h-4 w-4 ${showFavorites ? "fill-warning" : ""}`} />
            Favoritos
          </button>
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
            <p className="text-sm text-muted-foreground mt-1">Faça upload de um PDF para começar</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TenderCard key={t.id} tender={t} onUpdate={fetchTenders} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
