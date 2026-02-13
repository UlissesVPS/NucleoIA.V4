import { Users, UserCheck, UserX, Activity, FileText, GraduationCap, ShoppingBag, Bot, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import StatsCard from "@/components/StatsCard";
import { useSystemStats, useActivityLogs } from "@/hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const OverviewTab = () => {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: logsData, isLoading: logsLoading } = useActivityLogs({ limit: 8 });

  const activityLogs = logsData?.data || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login": return "\u{1F7E2}";
      case "logout": return "\u{1F534}";
      case "2fa": return "\u{1F511}";
      case "prompt": return "\u{1F4DD}";
      case "copy": return "\u{1F4CB}";
      case "aula": return "\u{1F393}";
      case "suspend": return "\u23F8";
      case "admin": return "\u2699\uFE0F";
      default: return "\u{1F4CC}";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "login": return "LOGIN";
      case "logout": return "LOGOUT";
      case "2fa": return "2FA";
      case "prompt": return "PROMPT";
      case "copy": return "COPY";
      case "aula": return "AULA";
      case "suspend": return "SUSPEND";
      case "admin": return "ADMIN";
      default: return type.toUpperCase();
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <StatsCard icon={Users} value={(stats?.totalUsers ?? 0).toString()} label="Total Membros" />
        </GlassCard>
        <GlassCard>
          <StatsCard icon={UserCheck} value={(stats?.activeUsers ?? 0).toString()} label="Ativos" />
        </GlassCard>
        <GlassCard>
          <StatsCard icon={UserX} value={((stats?.totalUsers ?? 0) - (stats?.activeUsers ?? 0)).toString()} label="Inativos" />
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.newUsersThisMonth ?? 0}</p>
              <p className="text-sm text-muted-foreground">Novos este m\u00EAs</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <StatsCard icon={FileText} value={(stats?.totalPrompts ?? 0).toLocaleString()} label="Prompts Total" />
        </GlassCard>
        <GlassCard>
          <StatsCard icon={GraduationCap} value={(stats?.totalCourses ?? 0).toString()} label="Cursos" />
        </GlassCard>
        <GlassCard>
          <StatsCard icon={ShoppingBag} value={(stats?.totalProducts ?? 0).toString()} label="Produtos" />
        </GlassCard>
        <GlassCard>
          <StatsCard icon={Bot} value={(stats?.totalAiTools ?? 0).toString()} label="IAs Ativas" />
        </GlassCard>
      </div>

      {/* Recent Activities */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando atividades...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {activityLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{getActivityIcon(log.type)}</span>
                  <div>
                    <p className="font-medium text-foreground">
                      {log.user?.name || "Usu\u00E1rio"} {log.description}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {getActivityLabel(log.type)}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhuma atividade recente</p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default OverviewTab;
