import { useState } from "react";
import { Activity, Monitor, Smartphone, RefreshCw, Clock, Globe, Loader2, AlertTriangle, Shield, Wifi, History, Search, ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOnlineUsers, useIpAlerts, useIpHistory } from "@/hooks/useApi";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const OnlineUsersTab = () => {
  const { data: onlineData, isLoading, refetch, dataUpdatedAt } = useOnlineUsers();
  const { data: ipAlertsData, refetch: refetchAlerts } = useIpAlerts();
  const { data: ipHistoryData, isLoading: isLoadingHistory, refetch: refetchHistory } = useIpHistory();
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"online" | "history">("online");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "flagged">("flagged");

  const users = onlineData?.users || onlineData || [];
  const inlineAlerts = onlineData?.ipAlerts || [];
  const detailedAlerts = ipAlertsData?.alerts || [];
  const totalAlerts24h = ipAlertsData?.totalAlerts || 0;
  const lastUpdate = lastManualRefresh || (dataUpdatedAt ? new Date(dataUpdatedAt) : new Date());

  // IP History data
  const historyMembers = ipHistoryData?.all || [];
  const flaggedMembers = ipHistoryData?.flagged || [];
  const flaggedCount = ipHistoryData?.flaggedCount || 0;

  const handleRefresh = () => {
    refetch();
    refetchAlerts();
    refetchHistory();
    setLastManualRefresh(new Date());
    toast.success("Lista atualizada!");
  };

  const getDeviceIcon = (device: string) => {
    return device === "mobile" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  const mobileCount = users.filter((u: any) => u.device === "mobile").length;
  const desktopCount = users.filter((u: any) => u.device === "desktop").length;
  const uniqueCities = new Set(users.map((u: any) => u.city).filter(Boolean)).size;
  const uniqueIps = new Set(users.map((u: any) => u.ip).filter((ip: string) => ip && ip !== "::ffff:127.0.0.1" && ip !== "127.0.0.1")).size;

  // Filter history members by search
  const displayMembers = historyFilter === "flagged" ? flaggedMembers : historyMembers;
  const filteredMembers = searchTerm
    ? displayMembers.filter((m: any) =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.ips?.some((ip: any) => ip.ip.includes(searchTerm))
      )
    : displayMembers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-foreground">Monitoramento de Sessoes</h2>
          {(inlineAlerts.length > 0 || totalAlerts24h > 0) && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {Math.max(inlineAlerts.length, totalAlerts24h)} alerta{Math.max(inlineAlerts.length, totalAlerts24h) !== 1 ? "s" : ""}
            </Badge>
          )}
          {flaggedCount > 0 && (
            <Badge variant="warning" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              <History className="h-3 w-3 mr-1" />
              {flaggedCount} com multi-IP
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "online" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("online")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Online Agora ({users.length})
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("history")}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          Historico de IPs
          {flaggedCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{flaggedCount}</span>
          )}
        </Button>
      </div>

      {/* ============== TAB: ONLINE AGORA ============== */}
      {activeTab === "online" && (
        <>
          {/* IP Alerts Section */}
          {detailedAlerts.length > 0 && (
            <GlassCard className="border-2 border-red-500/50 bg-red-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-500">Alerta - IPs Duplicados Ativos (24h)</h3>
                  <p className="text-sm text-muted-foreground">
                    {detailedAlerts.length} usuario{detailedAlerts.length !== 1 ? "s" : ""} com sessoes em 2+ IPs simultaneamente
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {detailedAlerts.map((alert: any) => (
                  <div key={alert.userId} className="rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-500/15 transition-colors"
                      onClick={() => setExpandedAlert(expandedAlert === alert.userId ? null : alert.userId)}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-foreground">{alert.name}</p>
                          <p className="text-sm text-muted-foreground">{alert.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">{alert.uniqueIps} IPs</Badge>
                        {expandedAlert === alert.userId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {expandedAlert === alert.userId && (
                      <div className="px-4 pb-4 space-y-2 border-t border-red-500/20 pt-3">
                        {alert.ips.map((ipGroup: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-background/50 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Wifi className="h-4 w-4 text-red-400" />
                              <span className="font-mono text-sm font-medium text-foreground">{ipGroup.ip}</span>
                              <Badge variant="outline" className="text-xs">{ipGroup.sessionCount} sessao(oes)</Badge>
                            </div>
                            {ipGroup.sessions.map((sess: any, sIdx: number) => (
                              <div key={sIdx} className="ml-6 text-xs text-muted-foreground flex items-center gap-3 py-1">
                                <span>{getDeviceIcon(sess.device || "desktop")} {sess.browser || "N/A"}</span>
                                {sess.city && <span>{sess.city}{sess.state ? `, ${sess.state}` : ""}</span>}
                                {sess.lastActivity && (
                                  <span>{formatDistanceToNow(new Date(sess.lastActivity), { addSuffix: true, locale: ptBR })}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Online Users List */}
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-4">Sessoes Ativas</h3>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum usuario online no momento</p>
            ) : (
              <div className="space-y-2">
                {users.map((user: any, index: number) => {
                  const isAlerted = inlineAlerts.some((a: any) => a.userId === user.id);
                  const ipDisplay = user.ip && user.ip !== "::ffff:127.0.0.1" && user.ip !== "127.0.0.1" ? user.ip : null;

                  return (
                    <div
                      key={(user.sessionId || user.id) + "-" + index}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                        isAlerted ? "bg-red-500/10 border border-red-500/20" : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`h-3 w-3 rounded-full ${isAlerted ? "bg-red-500" : "bg-green-500"} animate-pulse`} />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-foreground text-sm font-semibold">
                          {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.name}</p>
                            {isAlerted && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {ipDisplay ? (
                              <span className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-0.5 rounded">
                                <Wifi className="h-3 w-3" />
                                {ipDisplay}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Wifi className="h-3 w-3" />
                                Aguardando novo login
                              </span>
                            )}
                            {user.connectedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(user.connectedAt), { addSuffix: false, locale: ptBR })}
                              </span>
                            )}
                            {user.currentPage && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {user.currentPage}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {user.city && (
                          <p className="text-muted-foreground">{user.city}{user.state ? `, ${user.state}` : ""}</p>
                        )}
                        <p className="text-muted-foreground flex items-center gap-1 justify-end">
                          {getDeviceIcon(user.device || "desktop")}
                          {user.browser || "Navegador"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Session Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <GlassCard>
              <div className="text-center">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="text-center">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{mobileCount}</p>
                <p className="text-xs text-muted-foreground">Mobile</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="text-center">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{desktopCount}</p>
                <p className="text-xs text-muted-foreground">Desktop</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="text-center">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{uniqueIps}</p>
                <p className="text-xs text-muted-foreground">IPs unicos</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="text-center">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{uniqueCities}</p>
                <p className="text-xs text-muted-foreground">Cidades</p>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* ============== TAB: HISTORICO DE IPs ============== */}
      {activeTab === "history" && (
        <>
          {/* Search + Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button
              variant={historyFilter === "flagged" ? "default" : "outline"}
              size="sm"
              onClick={() => setHistoryFilter("flagged")}
              className="gap-1"
            >
              <AlertTriangle className="h-4 w-4" />
              Suspeitos ({flaggedCount})
            </Button>
            <Button
              variant={historyFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setHistoryFilter("all")}
              className="gap-1"
            >
              Todos ({historyMembers.length})
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <GlassCard>
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? "Nenhum membro encontrado com essa busca" : historyFilter === "flagged" ? "Nenhum membro com multiplos IPs detectado ainda. Os IPs serao registrados a partir dos proximos logins." : "Nenhum historico de IP disponivel ainda."}
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member: any) => (
                <GlassCard
                  key={member.userId}
                  className={member.uniqueIps >= 2 ? "border border-yellow-500/30" : ""}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedMember(expandedMember === member.userId ? null : member.userId)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-foreground text-sm font-semibold">
                        {member.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.name}</p>
                          {member.uniqueIps >= 2 && (
                            <Badge variant="warning" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                              {member.uniqueIps} IPs
                            </Badge>
                          )}
                          {!member.isActive && (
                            <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{member.ips?.length || 0} IP{(member.ips?.length || 0) !== 1 ? "s" : ""} registrado{(member.ips?.length || 0) !== 1 ? "s" : ""}</p>
                      </div>
                      {expandedMember === member.userId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {expandedMember === member.userId && member.ips && (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {member.ips.map((ipEntry: any, idx: number) => (
                        <div key={idx} className="rounded-lg bg-muted/30 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Wifi className="h-4 w-4 text-primary" />
                              <span className="font-mono text-sm font-medium text-foreground">{ipEntry.ip}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {ipEntry.loginCount > 0 && (
                                <Badge variant="outline" className="text-xs">{ipEntry.loginCount} login{ipEntry.loginCount !== 1 ? "s" : ""}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-6 text-xs text-muted-foreground space-y-1">
                            {ipEntry.cities?.length > 0 && (
                              <p className="flex items-center gap-1">
                                <Globe className="h-3 w-3" /> {ipEntry.cities.join(", ")}
                              </p>
                            )}
                            {ipEntry.devices?.length > 0 && (
                              <p className="flex items-center gap-1">
                                <Monitor className="h-3 w-3" /> {ipEntry.devices.join(", ")}
                              </p>
                            )}
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Primeiro uso: {format(new Date(ipEntry.firstSeen), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              {" | "}
                              Ultimo: {format(new Date(ipEntry.lastSeen), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OnlineUsersTab;
