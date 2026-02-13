import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  Calendar,
  Clock,
  Package,
  RefreshCw,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MoreVertical,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBackups, useBackupSchedule, useUpdateBackupSchedule } from "@/hooks/useApi";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getNextBackupTime = (hour: number, minute: number) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isToday = next.toDateString() === now.toDateString();
  const isTomorrow = next.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  return {
    hours, minutes, nextDate: next,
    label: isToday ? "Hoje" : isTomorrow ? "Amanha" : formatDate(next.toISOString()),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
};

const BackupsManager = () => {
  const { data: backupsResponse, isLoading: backupsLoading } = useBackups();
  const { data: schedule, isLoading: scheduleLoading } = useBackupSchedule();
  const updateScheduleMut = useUpdateBackupSchedule();

  const backups = backupsResponse?.data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "auto" | "manual">("all");

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<any>(null);

  // Detail modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

  useEffect(() => {
    if (schedule && !scheduleForm) {
      setScheduleForm({ ...schedule });
    }
  }, [schedule]);

  const countdown = useMemo(() => {
    const h = scheduleForm?.hour ?? schedule?.hour ?? 3;
    const m = scheduleForm?.minute ?? schedule?.minute ?? 0;
    return getNextBackupTime(h, m);
  }, [scheduleForm, schedule]);

  const isEnabled = scheduleForm?.enabled ?? schedule?.enabled ?? false;

  // Filtered backups
  const filteredBackups = useMemo(() => {
    return backups.filter((backup: any) => {
      if (filterType !== "all" && backup.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return backup.name?.toLowerCase().includes(query) || backup.filename?.toLowerCase().includes(query);
      }
      return true;
    });
  }, [backups, filterType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalSize = backups.reduce((acc: number, b: any) => acc + (b.size || 0), 0);
    return { total: backups.length, totalSize };
  }, [backups]);

  const toggleAutoBackup = async () => {
    const newEnabled = !isEnabled;
    setScheduleForm((prev: any) => ({ ...prev, enabled: newEnabled }));
    try {
      await updateScheduleMut.mutateAsync({ enabled: newEnabled });
      toast.success(newEnabled ? "Backup automatico ativado" : "Backup automatico desativado");
    } catch {
      toast.error("Erro ao atualizar agendamento");
    }
  };

  const saveSchedule = async () => {
    try {
      await updateScheduleMut.mutateAsync(scheduleForm);
      toast.success("Configuracao de backup salva");
      setShowScheduleModal(false);
    } catch {
      toast.error("Erro ao salvar configuracao");
    }
  };

  if (backupsLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-card border-white/10">
            <CardContent className="p-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">Total de Backups</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatBytes(stats.totalSize)} armazenados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-white/10">
            <CardContent className="p-5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">Proximo Backup Auto</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {isEnabled ? `${countdown.label} ${countdown.time}` : "Desativado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isEnabled ? `em ${countdown.hours}h ${countdown.minutes}min` : "Ative o backup automatico"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-white/10">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isEnabled ? "bg-success/10" : "bg-destructive/10")}>
                  <Clock className={cn("h-5 w-5", isEnabled ? "text-success" : "text-destructive")} />
                </div>
                <Switch checked={isEnabled} onCheckedChange={toggleAutoBackup} />
              </div>
              <p className="text-sm text-muted-foreground mt-3">Auto Backup</p>
              <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", isEnabled ? "bg-success" : "bg-destructive")} />
                {isEnabled ? "Ativo" : "Desativado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {schedule?.frequency === "daily" ? "Diario" : schedule?.frequency === "weekly" ? "Semanal" : schedule?.frequency || "—"} as {countdown.time}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-white/10">
            <CardContent className="p-5">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">Retencao</p>
              <p className="text-3xl font-bold text-foreground mt-1">{schedule?.retention || 7}</p>
              <p className="text-xs text-muted-foreground mt-1">backups mantidos</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => { setScheduleForm(schedule ? { ...schedule } : {}); setShowScheduleModal(true); }}>
              <Settings className="h-4 w-4 mr-2" /> Agendamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card className="bg-card border-white/10">
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[130px] bg-background border-white/10"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="auto">Automatico</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar backups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background border-white/10" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setFilterType("all"); setSearchQuery(""); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List Header */}
          <div className="px-4 py-2 border-b border-white/10 bg-muted/30">
            <span className="text-sm text-muted-foreground">{filteredBackups.length} backup(s)</span>
          </div>

          {/* Backup Items */}
          <ScrollArea className="max-h-[500px]">
            <div className="divide-y divide-white/5">
              {filteredBackups.map((backup: any) => (
                <div
                  key={backup.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-white/5 transition-colors",
                    backup.status === "failed" && "bg-destructive/5 border-l-2 border-l-destructive"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    backup.status === "failed" ? "bg-destructive/10" : "bg-primary/10"
                  )}>
                    <HardDrive className={cn("h-5 w-5", backup.status === "failed" ? "text-destructive" : "text-primary")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{backup.name || "Backup"}</span>
                      <Badge variant={backup.type === "auto" ? "secondary" : "outline"} className="text-xs">
                        {backup.type === "auto" ? <><Bot className="h-3 w-3 mr-1" /> Auto</> : <><User className="h-3 w-3 mr-1" /> Manual</>}
                      </Badge>
                      {backup.status === "success" && (
                        <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Sucesso
                        </Badge>
                      )}
                      {backup.status === "failed" && (
                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Falha
                        </Badge>
                      )}
                    </div>
                    {backup.filename && <p className="text-xs text-muted-foreground font-mono mt-0.5">{backup.filename}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(backup.createdAt)} as {formatTime(backup.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-medium text-foreground">{formatBytes(backup.size)}</p>
                    {backup.duration > 0 && (
                      <p className="text-xs text-muted-foreground">{Math.floor(backup.duration / 60)}m {backup.duration % 60}s</p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedBackup(backup); setShowDetailsModal(true); }}>
                        <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredBackups.length === 0 && (
                <div className="p-12 text-center">
                  <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum backup encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Configuracao de Backup Automatico
            </DialogTitle>
          </DialogHeader>

          {scheduleForm && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <Label>Ativar backup automatico</Label>
                <Switch checked={scheduleForm.enabled} onCheckedChange={(checked) => setScheduleForm((p: any) => ({ ...p, enabled: checked }))} />
              </div>

              <div className="space-y-3">
                <Label>Frequencia</Label>
                <div className="flex gap-2">
                  {[
                    { value: "daily", label: "Diario" },
                    { value: "every2days", label: "A cada 2 dias" },
                    { value: "weekly", label: "Semanal" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={scheduleForm.frequency === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setScheduleForm((p: any) => ({ ...p, frequency: opt.value }))}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Horario</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Select value={String(scheduleForm.hour ?? 3)} onValueChange={(v) => setScheduleForm((p: any) => ({ ...p, hour: parseInt(v) }))}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select value={String(scheduleForm.minute ?? 0)} onValueChange={(v) => setScheduleForm((p: any) => ({ ...p, minute: parseInt(v) }))}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((m) => (
                          <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {scheduleForm.frequency === "weekly" && (
                  <div className="flex-1">
                    <Label>Dia da semana</Label>
                    <Select value={String(scheduleForm.weekday ?? 0)} onValueChange={(v) => setScheduleForm((p: any) => ({ ...p, weekday: parseInt(v) }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"].map((day, i) => (
                          <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <Label>Retencao</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Manter ultimos</span>
                  <Select value={String(scheduleForm.retention ?? 7)} onValueChange={(v) => setScheduleForm((p: any) => ({ ...p, retention: parseInt(v) }))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 14, 30].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm">backups automaticos</span>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={scheduleForm.notifyEmail} onCheckedChange={(checked) => setScheduleForm((p: any) => ({ ...p, notifyEmail: !!checked }))} />
                  <span className="text-sm">Notificar por email apos backup automatico</span>
                </div>
                {scheduleForm.notifyEmail && (
                  <Input value={scheduleForm.email || ""} onChange={(e) => setScheduleForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
            <Button onClick={saveSchedule} disabled={updateScheduleMut.isPending}>
              {updateScheduleMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HardDrive className="h-4 w-4 mr-2" />}
              Salvar Configuracao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" /> Detalhes do Backup
            </DialogTitle>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Nome</span>
                  <p className="font-medium">{selectedBackup.name || "Backup"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <p className="font-medium flex items-center gap-2">
                    {selectedBackup.type === "auto" ? <><Bot className="h-4 w-4" /> Automatico</> : <><User className="h-4 w-4" /> Manual</>}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-medium flex items-center gap-2">
                    {selectedBackup.status === "success" ? <><CheckCircle className="h-4 w-4 text-success" /> Sucesso</> : <><XCircle className="h-4 w-4 text-destructive" /> Falha</>}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data</span>
                  <p className="font-medium">{formatDate(selectedBackup.createdAt)} as {formatTime(selectedBackup.createdAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tamanho</span>
                  <p className="font-medium">{formatBytes(selectedBackup.size)}</p>
                </div>
                {selectedBackup.filename && (
                  <div>
                    <span className="text-xs text-muted-foreground">Arquivo</span>
                    <p className="font-mono text-sm">{selectedBackup.filename}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupsManager;
