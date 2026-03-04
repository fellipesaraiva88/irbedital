import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const KeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Focus search input on dashboard
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          navigate("/");
          toast.info("Use Ctrl+K no Dashboard para buscar");
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        navigate("/upload");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return null;
};

export default KeyboardShortcuts;
