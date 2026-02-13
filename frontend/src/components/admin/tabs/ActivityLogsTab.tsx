import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityLogs } from "@/hooks/useApi";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

const ActivityLogsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);

  const params: Record<string, unknown> = { page, limit: 50 };
  if (filterType !== "all") params.type = filterType;

  const { data: logsData, isLoading } = useActivityLogs(params);

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;

  // Client-side search filter (API handles type filter)
  const filteredLogs = logs.filter((log: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.user?.name || "").toLowerCase().includes(q) ||
      (log.user?.email || "").toLowerCase().includes(q) ||
      (log.description || "").toLowerCase().includes(q)
    );
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case "LOGIN": return "🟢";
      case "LOGOUT": return "🔴";
      case "2FA": return "🔑";
      case "PROMPT": return "📝";
      case "COPY": return "📋";
      case "AULA": return "🎓";
      case "SUSPEND": return "⏸️";
      case "ADMIN": return "⚙️";
      default: return "📌";
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case "LOGIN": return <Badge variant="success">LOGIN</Badge>;
      case "LOGOUT": return <Badge variant="danger">LOGOUT</Badge>;
      case "2FA": return <Badge variant="warning">2FA</Badge>;
      case "PROMPT": return <Badge>PROMPT</Badge>;
      case "COPY": return <Badge>COPY</Badge>;
      case "AULA": return <Badge>AULA</Badge>;
      case "SUSPEND": return <Badge variant="danger">SUSPEND</Badge>;
      case "ADMIN": return <Badge variant="warning">ADMIN</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Logs de Atividade</h2>
        <p className="text-muted-foreground">Historico completo de acoes na plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <InputWithIcon
          icon={Search}
          placeholder="Buscar por usuario ou acao..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72"
        />

        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="LOGOUT">Logout</SelectItem>
            <SelectItem value="2FA">2FA</SelectItem>
            <SelectItem value="PROMPT">Prompts</SelectItem>
            <SelectItem value="COPY">Copias</SelectItem>
            <SelectItem value="AULA">Aulas</SelectItem>
            <SelectItem value="SUSPEND">Suspensoes</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick filters */}
        <div className="flex gap-2">
          <Button
            variant={filterType === "LOGIN" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterType(filterType === "LOGIN" ? "all" : "LOGIN"); setPage(1); }}
          >
            Login
          </Button>
          <Button
            variant={filterType === "2FA" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterType(filterType === "2FA" ? "all" : "2FA"); setPage(1); }}
          >
            2FA
          </Button>
          <Button
            variant={filterType === "PROMPT" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterType(filterType === "PROMPT" ? "all" : "PROMPT"); setPage(1); }}
          >
            Prompts
          </Button>
          <Button
            variant={filterType === "ADMIN" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterType(filterType === "ADMIN" ? "all" : "ADMIN"); setPage(1); }}
          >
            Admin
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground w-24">Horario</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground w-28">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descricao</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any) => {
                const ts = new Date(log.createdAt);
                return (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-sm">
                          🕐 {format(ts, "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isToday(ts) ? "Hoje" : isYesterday(ts) ? "Ontem" : format(ts, "dd/MM", { locale: ptBR })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getLogIcon(log.type)}</span>
                        {getLogBadge(log.type)}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{log.user?.name || "Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{log.user?.email || ""}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">{log.description}</p>
                      {log.metadata && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.metadata.ip && `IP: ${log.metadata.ip} `}
                          {log.metadata.tool && `Ferramenta: ${log.metadata.tool} `}
                          {log.metadata.promptId && `Prompt #${log.metadata.promptId}`}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pagination ? `Pagina ${pagination.page} de ${pagination.totalPages} (${pagination.total} logs)` : `${filteredLogs.length} logs`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Anterior</Button>
            <Button variant="outline" size="sm" disabled={!pagination || page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Proximo →</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ActivityLogsTab;
