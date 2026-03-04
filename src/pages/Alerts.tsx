import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";

const Alerts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="mt-1 text-muted-foreground">Configure alertas para novos editais</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Em breve</CardTitle>
            <CardDescription>A funcionalidade de alertas está sendo desenvolvida</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              Você poderá configurar alertas por categoria, valor e localização para receber notificações de novos editais.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
