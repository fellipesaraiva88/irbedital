import { Upload, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WelcomeBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground animate-fade-in">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold">Bem-vindo ao LicitaAI</h2>
          <p className="text-sm text-primary-foreground/80 mt-1 max-w-md">
            Faça upload do seu primeiro edital e deixe a IA analisar requisitos, atestados e riscos automaticamente.
          </p>
        </div>
        <Button
          onClick={() => navigate("/upload")}
          size="lg"
          className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm gap-2 shrink-0"
        >
          <Upload className="h-4 w-4" />
          Enviar Edital
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
