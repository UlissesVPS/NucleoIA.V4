import { useState, useMemo } from "react";
import {
  HardDrive,
  MemoryStick,
  Activity,
  Server,
  Bell,
  RefreshCw,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVpsStats } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";

// Helper function to get color based on percentage
const getStatusColor = (percentage: number) => {
  if (percentage < 50) return "text-success";
  if (percentage < 75) return "text-warning";
  return "text-destructive";
};

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return "bg-success";
  if (percentage < 75) return "bg-warning";
  return "bg-destructive";
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

// Metric Card Component
const MetricCard = ({
  icon: Icon,
  title,
  value,
  detail,
  percentage,
  iconColor,
  showPercentageColor = true,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  detail: React.ReactNode;
  percentage?: number;
  iconColor: string;
  showPercentageColor?: boolean;
}) => (
  <Card className="bg-card/80 border-white/10 hover:border-white/20 transition-colors">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", iconColor)}>
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        {percentage !== undefined && (
          <span
            className={cn(
              "text-sm font-medium",
              showPercentageColor ? getStatusColor(percentage) : "text-muted-foreground"
            )}
          >
            {percentage}%
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground">{detail}</p>
      {percentage !== undefined && (
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", getProgressColor(percentage))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </CardContent>
  </Card>
);

// Processes Card Component
const ProcessesCard = ({ services, uptime }: { services: any[]; uptime: number }) => (
  <Card className="bg-card/80 border-white/10 h-full">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Server className="h-5 w-5 text-primary" />
        Processos Ativos
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {services.map((service: any) => (
        <div
          key={service.name}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-white/5"
        >
          <div className="flex items-center gap-3">
            {service.status === "online" ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm text-foreground">{service.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatUptime(service.uptime)}</span>
          </div>
        </div>
      ))}
      <div className="pt-2 text-center">
        <span className="text-sm text-muted-foreground">
          Uptime total: <span className="text-foreground font-medium">{formatUptime(uptime)}</span>
        </span>
      </div>
    </CardContent>
  </Card>
);

// Alerts Card Component based on real data
const AlertsCard = ({ data }: { data: any }) => {
  const alerts = useMemo(() => {
    const list: { type: string; title: string; message: string }[] = [];

    if (data.disk?.percent > 80) {
      list.push({ type: "critical", title: "Disco acima de 80%", message: "Espaço em disco criticamente baixo. Faça limpeza imediata." });
    } else if (data.disk?.percent > 60) {
      list.push({ type: "warning", title: `Disco em ${data.disk.percent}%`, message: "Considere limpeza de arquivos temporários ou upgrade de disco." });
    }

    if (data.memory?.percent > 80) {
      list.push({ type: "warning", title: `RAM em ${data.memory.percent}%`, message: "Uso de memória elevado. Monitore processos." });
    } else if (data.memory?.percent < 60) {
      list.push({ type: "info", title: "RAM com uso normal", message: "Sistema operando dentro dos parâmetros normais." });
    }

    if (data.cpu?.percent > 80) {
      list.push({ type: "warning", title: `CPU em ${data.cpu.percent}%`, message: "Processamento elevado. Verifique processos." });
    }

    const offlineServices = data.services?.filter((s: any) => s.status !== 'online') || [];
    if (offlineServices.length > 0) {
      list.push({ type: "critical", title: "Serviço offline", message: `${offlineServices.map((s: any) => s.name).join(', ')} não está respondendo.` });
    }

    if (list.length === 0) {
      list.push({ type: "info", title: "Tudo operacional", message: "Todos os serviços e recursos estão funcionando normalmente." });
    }

    return list;
  }, [data]);

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "critical":
        return { border: "border-destructive/50", bg: "bg-destructive/10", icon: XCircle, iconColor: "text-destructive" };
      case "warning":
        return { border: "border-warning/50", bg: "bg-warning/10", icon: AlertTriangle, iconColor: "text-warning" };
      case "info":
        return { border: "border-success/50", bg: "bg-success/10", icon: Info, iconColor: "text-success" };
      case "tip":
        return { border: "border-primary/50", bg: "bg-primary/10", icon: Lightbulb, iconColor: "text-primary" };
      default:
        return { border: "border-white/10", bg: "bg-muted/50", icon: Info, iconColor: "text-muted-foreground" };
    }
  };

  return (
    <Card className="bg-card/80 border-white/10 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Alertas & Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
          const styles = getAlertStyles(alert.type);
          const Icon = styles.icon;
          return (
            <div key={index} className={cn("p-3 rounded-lg border", styles.border, styles.bg)}>
              <div className="flex items-start gap-3">
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", styles.iconColor)} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Server Info Component
const ServerInfoCard = ({ data }: { data: any }) => (
  <Card className="bg-card/80 border-white/10">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Server className="h-5 w-5 text-primary" />
        Informações do Servidor
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Node.js", value: data.node || "—" },
          { label: "RAM Total", value: formatBytes(data.memory?.total || 0) },
          { label: "Disco Total", value: formatBytes(data.disk?.total || 0) },
          { label: "Uptime", value: formatUptime(data.uptime || 0) },
          { label: "Load Avg", value: (data.cpu?.loadAvg || [0, 0, 0]).map((v: number) => v.toFixed(2)).join(" / ") },
          { label: "Domínio", value: "painel.nucleoia.online", full: true },
        ].map((item: any) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-white/5",
              item.full && "sm:col-span-2 lg:col-span-3"
            )}
          >
            <span className="text-sm text-muted-foreground">{item.label}:</span>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Main Server Monitor Component
const ServerMonitor = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useVpsStats();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system', 'vps-stats'] });
  };

  const timeSinceUpdate = useMemo(() => {
    if (!dataUpdatedAt) return "—";
    const diff = Math.floor((Date.now() - dataUpdatedAt) / 60000);
    return diff < 1 ? "agora" : `há ${diff} min`;
  }, [dataUpdatedAt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Erro ao carregar dados do servidor.
      </div>
    );
  }

  const cpuPercent = Math.round(data.cpu?.percent || 0);
  const memPercent = data.memory?.percent || 0;
  const diskPercent = data.disk?.percent || 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Atualizado {timeSinceUpdate}</span>
          <span className="text-xs">(auto: 30s)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={HardDrive}
          title="Disco"
          value={`${diskPercent}%`}
          detail={`${formatBytes(data.disk?.used || 0)} / ${formatBytes(data.disk?.total || 0)}`}
          percentage={diskPercent}
          iconColor="bg-orange-500/20"
        />
        <MetricCard
          icon={MemoryStick}
          title="RAM"
          value={`${memPercent}%`}
          detail={`${formatBytes(data.memory?.used || 0)} / ${formatBytes(data.memory?.total || 0)}`}
          percentage={memPercent}
          iconColor="bg-blue-500/20"
        />
        <MetricCard
          icon={Activity}
          title="CPU"
          value={`${cpuPercent}%`}
          detail={`Load: ${(data.cpu?.loadAvg?.[0] || 0).toFixed(2)}`}
          percentage={cpuPercent}
          iconColor="bg-green-500/20"
        />
        <MetricCard
          icon={Server}
          title="Serviços"
          value={`${data.services?.filter((s: any) => s.status === 'online').length || 0}/${data.services?.length || 0}`}
          detail="online"
          iconColor="bg-purple-500/20"
          showPercentageColor={false}
        />
      </div>

      {/* Processes & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProcessesCard services={data.services || []} uptime={data.uptime || 0} />
        <AlertsCard data={data} />
      </div>

      {/* Server Info */}
      <ServerInfoCard data={data} />
    </div>
  );
};

export default ServerMonitor;
