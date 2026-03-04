import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile ? "pt-16 px-4 pb-8" : "pl-64"}>
        <div className={isMobile ? "py-4" : "container py-8 max-w-6xl"}>{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
