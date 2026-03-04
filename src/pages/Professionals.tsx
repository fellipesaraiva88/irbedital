import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Upload, UserCircle, Stethoscope, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Professional {
  id: string;
  name: string;
  crm: string | null;
  specialty: string | null;
  availability: string | null;
  source_file: string | null;
  created_at: string;
}

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from("professionals")
      .select("*")
      .order("name", { ascending: true });
    setProfessionals((data as unknown as Professional[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const specialties = [...new Set(professionals.map((p) => p.specialty).filter(Boolean))] as string[];

  const filtered = professionals.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.crm?.includes(search);
    const matchesSpec = specialtyFilter === "all" || p.specialty === specialtyFilter;
    return matchesSearch && matchesSpec;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const filePath = `shared/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tender-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      const { data, error: fnError } = await supabase.functions.invoke("extract-professionals", {
        body: { filePath, fileName: file.name },
      });

      if (fnError) throw fnError;
      setUploadProgress(100);

      const count = data?.count || 0;
      toast.success(`${count} profissionais extraídos com sucesso!`);
      fetchProfessionals();
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar arquivo");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Profissionais</h1>
            <p className="mt-1 text-muted-foreground">Pool de profissionais para editais</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Users className="h-3.5 w-3.5 mr-1" />
              {professionals.length} profissionais
            </Badge>
          </div>
        </div>

        {/* Upload card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm">Importar Profissionais</CardTitle>
            <CardDescription>Envie um PDF com dados de profissionais para extração automática com IA</CardDescription>
          </CardHeader>
          <CardContent>
            {uploading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-sm">Extraindo profissionais com IA...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : (
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                  <Upload className="h-4 w-4" /> Upload PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CRM..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas especialidades</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Professional list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-lg font-semibold">Nenhum profissional encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Faça upload de um PDF para importar profissionais</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      {p.crm && <p className="text-xs text-muted-foreground">CRM: {p.crm}</p>}
                    </div>
                  </div>
                  {p.specialty && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>{p.specialty}</span>
                    </div>
                  )}
                  {p.availability && (
                    <Badge variant="outline" className="text-[10px]">{p.availability}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Professionals;
