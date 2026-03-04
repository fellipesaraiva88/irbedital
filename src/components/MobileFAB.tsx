import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Upload, ArrowLeftRight, X } from "lucide-react";

const MobileFAB = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!isMobile) return null;

  const actions = [
    { icon: Upload, label: "Upload", to: "/upload" },
    { icon: ArrowLeftRight, label: "Comparar", to: "/compare" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action buttons */}
      {open && actions.map((action, i) => (
        <button
          key={action.to}
          onClick={() => { navigate(action.to); setOpen(false); }}
          className="flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2.5 text-sm font-medium animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <action.icon className="h-4 w-4 text-primary" />
          {action.label}
        </button>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform ${open ? "rotate-45" : ""}`}
        aria-label={open ? "Fechar menu" : "Ações rápidas"}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default MobileFAB;
