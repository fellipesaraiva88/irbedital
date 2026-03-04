import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="container py-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
