import { Navigate } from "react-router-dom";
import { Settings2, Activity, Download, Plug, HardDrive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useBackups, useSystemStats } from "@/hooks/useApi";
import ServerMonitor from "@/components/sistema/ServerMonitor";
import PromptImporter from "@/components/sistema/PromptImporter";
import ApiWebhooks from "@/components/sistema/ApiWebhooks";
import BackupsManager from "@/components/sistema/BackupsManager";

const formatBackupDate = (dateStr?: string) => {
  if (!dateStr) return "Nenhum backup encontrado";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Data indisponível";
  }
};

const Sistema = () => {
  const { user } = useAuth();
  const { data: backupsResponse } = useBackups();
  const { data: systemStats, isError: statsError } = useSystemStats();

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const backups = backupsResponse?.data || [];
  const lastBackup = backups.length > 0 ? backups[0] : null;
  const lastBackupDate = lastBackup?.createdAt || lastBackup?.date;

  // Determine system status from API availability
  const isOnline = !statsError;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Settings2 className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Sistema de Gerenciamento
              </h1>
              <p className="text-sm text-muted-foreground">
                Painel exclusivo Super Admin • Controle total da plataforma
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="flex items-center gap-1.5">
                <span className={"h-2 w-2 rounded-full " + (isOnline ? "bg-success animate-pulse" : "bg-destructive")} />
                <span className={(isOnline ? "text-success" : "text-destructive") + " font-medium"}>
                  {isOnline ? "Online" : "Indisponível"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Último backup:</span>
              <span className="text-foreground">{formatBackupDate(lastBackupDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="monitor" className="w-full">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start bg-transparent border-b border-white/10 rounded-none p-0 h-auto">
            <TabsTrigger 
              value="monitor" 
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Monitor do Servidor</span>
            </TabsTrigger>
            <TabsTrigger 
              value="importador" 
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Importador de Prompts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="api" 
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Plug className="h-4 w-4" />
              <span className="text-sm font-medium">API & Webhooks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="backups" 
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <HardDrive className="h-4 w-4" />
              <span className="text-sm font-medium">Backups</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="monitor" className="mt-6">
          <ServerMonitor />
        </TabsContent>

        <TabsContent value="importador" className="mt-6">
          <PromptImporter />
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <ApiWebhooks />
        </TabsContent>

        <TabsContent value="backups" className="mt-6">
          <BackupsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente para cards placeholder
const PlaceholderCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-card p-12 flex flex-col items-center justify-center text-center">
    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-md mb-6">{description}</p>
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning text-sm font-medium border border-warning/30">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      Em desenvolvimento
    </span>
  </div>
);

export default Sistema;
