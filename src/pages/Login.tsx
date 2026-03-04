import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FileSearch, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PIN_CODE = "2026";

const Login = () => {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleComplete = (pin: string) => {
    if (pin === PIN_CODE) {
      login();
      navigate("/");
    } else {
      toast.error("PIN incorreto");
      setShake(true);
      setTimeout(() => { setShake(false); setValue(""); }, 500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className={`w-full max-w-xs text-center relative z-10 animate-fade-in ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
          <FileSearch className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">LicitaAI</h1>
        <p className="mt-1 mb-2 text-muted-foreground">Análise inteligente de editais</p>
        
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <Shield className="h-3 w-3 text-success" />
          <span className="text-[11px] text-muted-foreground">Acesso protegido</span>
        </div>

        <InputOTP maxLength={4} value={value} onChange={setValue} onComplete={handleComplete}>
          <InputOTPGroup className="gap-3 justify-center">
            <InputOTPSlot index={0} className="h-14 w-14 text-2xl font-display rounded-xl border-border shadow-sm" />
            <InputOTPSlot index={1} className="h-14 w-14 text-2xl font-display rounded-xl border-border shadow-sm" />
            <InputOTPSlot index={2} className="h-14 w-14 text-2xl font-display rounded-xl border-border shadow-sm" />
            <InputOTPSlot index={3} className="h-14 w-14 text-2xl font-display rounded-xl border-border shadow-sm" />
          </InputOTPGroup>
        </InputOTP>

        <p className="mt-6 text-[11px] text-muted-foreground/60">Digite o PIN de 4 dígitos para acessar</p>
      </div>
    </div>
  );
};

export default Login;
