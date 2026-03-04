import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload as UploadIcon, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<"select" | "uploading" | "analyzing" | "done">("select");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 20MB.");
        return;
      }
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    try {
      setStep("uploading");
      setProgress(20);

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tender-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(40);

      // Create tender record
      const { data: tender, error: insertError } = await supabase
        .from("tenders")
        .insert({
          user_id: user.id,
          title: title.trim(),
          file_name: file.name,
          file_path: filePath,
          status: "analyzing" as const,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setProgress(60);
      setStep("analyzing");

      // Call AI analysis edge function
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Upload de Edital</h1>
          <p className="mt-1 text-muted-foreground">Envie um PDF para análise automática com IA</p>
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
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => fileRef.current?.click()}
                >
                  <UploadIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">{file ? file.name : "Clique para selecionar um arquivo"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">ou arraste e solte aqui</p>
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
                    {step === "analyzing" && "Extraindo informações do edital"}
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {step === "done" && (
              <div className="space-y-4 py-6 text-center">
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
