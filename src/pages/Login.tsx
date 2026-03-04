import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PIN_CODE = "2026";

const Login = () => {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleComplete = (pin: string) => {
    if (pin === PIN_CODE) {
      login();
      navigate("/");
    } else {
      toast.error("PIN incorreto");
      setValue("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <FileSearch className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">LicitaAI</h1>
        <p className="mt-1 mb-8 text-muted-foreground">Digite o PIN para acessar</p>

        <InputOTP maxLength={4} value={value} onChange={setValue} onComplete={handleComplete}>
          <InputOTPGroup className="gap-3 justify-center">
            <InputOTPSlot index={0} className="h-14 w-14 text-2xl font-display rounded-xl border-border" />
            <InputOTPSlot index={1} className="h-14 w-14 text-2xl font-display rounded-xl border-border" />
            <InputOTPSlot index={2} className="h-14 w-14 text-2xl font-display rounded-xl border-border" />
            <InputOTPSlot index={3} className="h-14 w-14 text-2xl font-display rounded-xl border-border" />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
};

export default Login;
