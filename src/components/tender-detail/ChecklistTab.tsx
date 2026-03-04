import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  tender_id: string;
  title: string;
  description: string | null;
  source: string;
  status: string;
  sort_order: number;
}

const SOURCE_LABELS: Record<string, string> = {
  requirement: "Requisito",
  compliance: "Compliance",
  atestado: "Atestado",
  manual: "Manual",
};

const SOURCE_COLORS: Record<string, string> = {
  requirement: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  compliance: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  atestado: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  manual: "bg-muted text-muted-foreground border-border",
};

const ChecklistTab = ({ tenderId }: { tenderId: string }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const fetchItems = async () => {
    const { data } = await (supabase as any)
      .from("tender_checklist_items")
      .select("*")
      .eq("tender_id", tenderId)
      .order("sort_order", { ascending: true });
    setItems((data as unknown as ChecklistItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [tenderId]);

  const toggleItem = async (item: ChecklistItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    await (supabase as any).from("tender_checklist_items").update({ status: newStatus }).eq("id", item.id);
    setItems(items.map((i) => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const addItem = async () => {
    if (!newItemTitle.trim()) return;
    const { data } = await (supabase as any).from("tender_checklist_items").insert({
      tender_id: tenderId,
      title: newItemTitle.trim(),
      source: "manual",
      status: "pending",
      sort_order: items.length,
    } as any).select().single();
    if (data) {
      setItems([...items, data as unknown as ChecklistItem]);
      setNewItemTitle("");
      setShowAdd(false);
      toast.success("Item adicionado");
    }
  };

  const completed = items.filter((i) => i.status === "completed").length;
  const total = items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by source
  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    acc[item.source] = acc[item.source] || [];
    acc[item.source].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p>Nenhum item no checklist.</p>
          <p className="text-xs mt-1">Clique "Iniciar Montagem" para gerar automaticamente.</p>
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
            <span className="font-medium">{completed}/{total} completos</span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </CardContent>
      </Card>

      {/* Grouped items */}
      {Object.entries(grouped).map(([source, sourceItems]) => (
        <div key={source} className="space-y-2">
          <Badge variant="outline" className={SOURCE_COLORS[source]}>
            {SOURCE_LABELS[source] || source} ({sourceItems.length})
          </Badge>
          {sourceItems.map((item) => (
            <Card key={item.id} className={`border-border/50 transition-opacity ${item.status === "completed" ? "opacity-60" : ""}`}>
              <CardContent className="p-3 flex items-start gap-3">
                <Checkbox
                  checked={item.status === "completed"}
                  onCheckedChange={() => toggleItem(item)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Add item */}
      {showAdd ? (
        <div className="flex gap-2">
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Novo item..."
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            autoFocus
          />
          <Button size="sm" onClick={addItem}>Adicionar</Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewItemTitle(""); }}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </Button>
      )}
    </div>
  );
};

export default ChecklistTab;
