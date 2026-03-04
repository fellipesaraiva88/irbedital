import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload as UploadIcon, FileText, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<"select" | "uploading" | "analyzing" | "done">("select");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const processFile = (f: File) => {
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    try {
      setStep("uploading");
      setProgress(20);

      const filePath = `shared/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tender-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(40);

      const { data: tender, error: insertError } = await supabase
        .from("tenders")
        .insert({
          title: title.trim(),
          file_name: file.name,
          file_path: filePath,
          status: "analyzing" as const,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;
      setProgress(60);
      setStep("analyzing");

      const { data: analysisData, error: fnError } = await supabase.functions.invoke("analyze-tender", {
        body: { tenderId: tender.id, filePath },
      });

      if (fnError) throw fnError;
      setProgress(100);
      setStep("done");
      toast.success("Edital analisado com sucesso!");

      setTimeout(() => navigate(`/tender/${tender.id}`), 1500);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar edital");
      setStep("select");
      setProgress(0);
    }
  };

  const steps = [
    { key: "select", label: "Selecionar", icon: UploadIcon },
    { key: "uploading", label: "Enviar", icon: FileText },
    { key: "analyzing", label: "Analisar", icon: Sparkles },
    { key: "done", label: "Concluído", icon: CheckCircle2 },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">Upload</span>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Upload de Edital</h1>
          <p className="mt-1 text-muted-foreground">Envie um PDF para análise automática com IA</p>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-1" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemax={4}>
          {steps.map((s, i) => {
            const isActive = i === stepIndex;
            const isComplete = i < stepIndex;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isComplete ? "text-success" : isActive ? "text-primary" : "text-muted-foreground/50"}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all ${isComplete ? "bg-success/10 text-success" : isActive ? "bg-primary/10 text-primary ring-2 ring-primary/20" : "bg-muted"}`}>
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${isComplete ? "bg-success/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-lg">Enviar documento</CardTitle>
            <CardDescription>Formatos aceitos: PDF (máx. 20MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === "select" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Título do edital</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Pregão Eletrônico 001/2026" />
                </div>

                <div
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                    dragOver
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : file
                        ? "border-success/50 bg-success/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Selecionar arquivo PDF"
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                >
                  {file ? (
                    <>
                      <FileText className="mb-3 h-10 w-10 text-success" />
                      <p className="text-sm font-medium text-success">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB — Clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <UploadIcon className={`mb-3 h-10 w-10 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground/50"}`} />
                      <p className="text-sm font-medium">
                        {dragOver ? "Solte o arquivo aqui" : "Clique ou arraste um arquivo"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF até 20MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </div>

                <Button onClick={handleUpload} disabled={!file || !title.trim()} className="w-full" size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analisar com IA
                </Button>
              </>
            )}

            {(step === "uploading" || step === "analyzing") && (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  {step === "uploading" ? (
                    <UploadIcon className="h-7 w-7 text-primary animate-pulse" />
                  ) : (
                    <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-display font-semibold">
                    {step === "uploading" ? "Enviando arquivo..." : "Analisando com IA..."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step === "analyzing" && "Extraindo requisitos, atestados e riscos"}
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}

            {step === "done" && (
              <div className="space-y-4 py-6 text-center animate-fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="font-display font-semibold">Análise concluída!</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecionando para os detalhes...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
