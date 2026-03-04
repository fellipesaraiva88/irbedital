import { FileSearch, LayoutDashboard, Upload, Bell, LogOut, ArrowLeftRight, Clock, Menu, X, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload de Edital" },
  { to: "/professionals", icon: Users, label: "Profissionais" },
  { to: "/compare", icon: ArrowLeftRight, label: "Comparar" },
  { to: "/history", icon: Clock, label: "Histórico" },
  { to: "/alerts", icon: Bell, label: "Alertas" },
];

const AppSidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const handleNavClick = (to: string) => {
    navigate(to);
    if (isMobile) setOpen(false);
  };

  const sidebar = (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200",
      isMobile && !open && "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <FileSearch className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">LicitaAI</span>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            onClick={() => handleNavClick(to)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              location.pathname === to
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 rounded-lg bg-card border border-border p-2 shadow-md md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      {isMobile && open && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
      )}
      {sidebar}
    </>
  );
};

export default AppSidebar;
