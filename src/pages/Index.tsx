import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import TenderCard from "@/components/TenderCard";
import SkeletonCard from "@/components/SkeletonCard";
import WelcomeBanner from "@/components/WelcomeBanner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender, TenderCategory, CATEGORY_LABELS, STATUS_LABELS, TenderStatus } from "@/lib/tender-types";
import { Search, FileSearch, TrendingUp, Clock, CheckCircle2, AlertTriangle, Star, Hammer, Send, Trophy, Gauge, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const CHART_COLORS = ["hsl(230,80%,56%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,55%)", "hsl(280,60%,55%)", "hsl(200,70%,50%)", "hsl(320,60%,50%)", "hsl(100,50%,40%)"];

const pipelineStatusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  analyzing: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  analyzed: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  em_montagem: "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20",
  proposta_pronta: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  enviado: "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
  resultado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
  archived: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
};

const pipelineIcons: Record<string, typeof FileSearch> = {
  new: FileSearch,
  analyzing: Clock,
  analyzed: CheckCircle2,
  em_montagem: Hammer,
  proposta_pronta: CheckCircle2,
  enviado: Send,
  resultado: Trophy,
  archived: Clock,
};

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
      const matchesFav = !showFavorites || t.is_favorite;
      return matchesSearch && matchesCategory && matchesStatus && matchesFav;
    })
    .sort((a, b) => {
      if (sortBy === "value") return (Number(b.value_estimate) || 0) - (Number(a.value_estimate) || 0);
      if (sortBy === "deadline") return (a.deadline || "z").localeCompare(b.deadline || "z");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const countByStatus = (status: TenderStatus) => tenders.filter((t) => t.status === status).length;

  const totalPipelineValue = tenders
    .filter(t => !["archived", "resultado"].includes(t.status) && t.value_estimate)
    .reduce((sum, t) => sum + Number(t.value_estimate || 0), 0);

  const avgScore = (() => {
    const scored = tenders.filter(t => (t.ai_insights as any)?.score != null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((s, t) => s + ((t.ai_insights as any)?.score || 0), 0) / scored.length);
  })();

  const topOpportunities = tenders
    .filter(t => {
      const s = (t.ai_insights as any)?.score;
      return s != null && s >= 60 && !["archived", "resultado"].includes(t.status);
    })
    .sort((a, b) => ((b.ai_insights as any)?.score || 0) - ((a.ai_insights as any)?.score || 0))
    .slice(0, 3);

  const stats = {
    total: tenders.length,
    analyzed: countByStatus("analyzed"),
    em_montagem: countByStatus("em_montagem"),
    enviado: countByStatus("enviado") + countByStatus("proposta_pronta"),
    won: tenders.filter((t) => t.status === "resultado" && (t as any).result === "won").length,
    lost: tenders.filter((t) => t.status === "resultado" && (t as any).result === "lost").length,
  };

  const successRate = (stats.won + stats.lost) > 0
    ? Math.round((stats.won / (stats.won + stats.lost)) * 100)
    : null;

  const allUpcomingDeadlines = tenders
    .filter((t) => {
      if (!t.deadline || t.status === "archived") return false;
      const diff = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const deadlineAlerts = allUpcomingDeadlines.filter((t) => {
    const diff = (new Date(t.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

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

  const pipelineStatuses: TenderStatus[] = ["new", "analyzing", "analyzed", "em_montagem", "proposta_pronta", "enviado", "resultado", "archived"];

  const activeFiltersCount = [categoryFilter !== "all", statusFilter !== "all", showFavorites, search.length > 0].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with keyboard shortcut hint */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Visão geral dos seus editais</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground font-mono">
                Ctrl+K buscar
              </kbd>
            </TooltipTrigger>
            <TooltipContent>Atalhos: Ctrl+K buscar, Ctrl+U upload</TooltipContent>
          </Tooltip>
        </div>

        {/* Welcome banner for empty state */}
        {!loading && tenders.length === 0 && <WelcomeBanner />}

        {/* Pipeline horizontal - improved with icons & tooltips */}
        {tenders.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {pipelineStatuses.map((status) => {
              const count = countByStatus(status);
              const isActive = statusFilter === status;
              const Icon = pipelineIcons[status];
              return (
                <Tooltip key={status}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter(isActive ? "all" : status)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? pipelineStatusColors[status].replace("hover:", "") + " ring-2 ring-offset-1 ring-current/20 scale-105"
                          : count === 0 ? "opacity-50 " + pipelineStatusColors[status] : pipelineStatusColors[status]
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{STATUS_LABELS[status]}</span>
                      <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center">
                        {count}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{STATUS_LABELS[status]}: {count} edital(is)</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Stats - with animated counters */}
        {tenders.length > 0 && (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
            {[
              { label: "Total", value: stats.total, icon: FileSearch, color: "text-primary" },
              { label: "Analisados", value: stats.analyzed, icon: CheckCircle2, color: "text-success" },
              { label: "Em Montagem", value: stats.em_montagem, icon: Hammer, color: "text-orange-500" },
              { label: "Enviados", value: stats.enviado, icon: Send, color: "text-purple-500" },
              { label: "Score Médio", value: avgScore !== null ? `${avgScore}` : "—", icon: Gauge, color: avgScore && avgScore >= 60 ? "text-success" : "text-warning" },
              { label: "Valor Pipeline", value: totalPipelineValue > 0 ? `R$${(totalPipelineValue / 1000).toFixed(0)}k` : "—", icon: DollarSign, color: "text-success" },
            ].map((stat, i) => (
              <Card key={stat.label} className="border-border/50 hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={`rounded-xl bg-muted p-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold font-display">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Top Opportunities */}
        {topOpportunities.length > 0 && (
          <Card className="border-success/30 bg-success/5 animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm flex items-center gap-2 text-success">
                <TrendingUp className="h-4 w-4" /> Melhores Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topOpportunities.map((t) => {
                const s = (t.ai_insights as any)?.score;
                return (
                  <a key={t.id} href={`/tender/${t.id}`} className="flex items-center justify-between text-sm hover:bg-success/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="truncate font-medium block">{t.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.organization && `${t.organization} • `}
                        {t.value_estimate ? `R$ ${Number(t.value_estimate).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : ""}
                      </span>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0 border-success/30 text-success font-bold">
                      {s}pts
                    </Badge>
                  </a>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Deadline Alerts - clickable */}
        {deadlineAlerts.length > 0 && (
          <Card className="border-warning/30 bg-warning/5 animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" /> Prazos Próximos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlineAlerts.map((t) => {
                const days = Math.ceil((new Date(t.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <a key={t.id} href={`/tender/${t.id}`} className="flex items-center justify-between text-sm hover:bg-warning/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <span className="truncate flex-1 font-medium">{t.title}</span>
                    <Badge variant={days <= 1 ? "destructive" : days <= 3 ? "outline" : "secondary"} className="ml-2 shrink-0">
                      {days === 0 ? "Hoje!" : days === 1 ? "Amanhã" : `${days} dias`}
                    </Badge>
                  </a>
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

        {/* Filters - improved with active count badge and clear */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar editais... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Buscar editais"
            />
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
            <SelectTrigger className="w-full sm:w-40">
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
            aria-pressed={showFavorites}
          >
            <Star className={`h-4 w-4 ${showFavorites ? "fill-warning" : ""}`} />
            Favoritos
          </button>

          {/* Active filters indicator */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); setShowFavorites(false); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Limpar {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && tenders.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {tenders.length} edital(is)
            {search && <> para "<strong className="text-foreground">{search}</strong>"</>}
          </p>
        )}

        {/* Tender list - with skeletons */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <FileSearch className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-lg font-semibold">
              {tenders.length === 0 ? "Nenhum edital ainda" : "Nenhum resultado"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tenders.length === 0 ? "Faça upload de um PDF para começar" : "Tente ajustar os filtros"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t, i) => (
              <div key={t.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <TenderCard tender={t} onUpdate={fetchTenders} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
