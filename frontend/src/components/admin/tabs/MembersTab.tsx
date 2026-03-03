import { useState, useMemo } from "react";
import {
  Search,
  Copy,
  Check,
  Ban,
  UserCheck,
  CalendarIcon,
  CalendarPlus,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Users,
  UserX,
  Clock,
  CalendarDays,
  AlertCircle,
  ShieldOff,
  Crown,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format, addMonths, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useUsers,
  useUserStats,
  useUpdateUserStatus,
  useUpdateSubscription,
} from "@/hooks/useApi";

interface MemberUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  plan: string;
  planTier?: string;
  subscriptionStatus: string;
  realSubscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

const MembersTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByExpiration, setSortByExpiration] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [datePickerUser, setDatePickerUser] = useState<MemberUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<{
    user: MemberUser;
    action: "suspend" | "reactivate";
  } | null>(null);

  const { data: usersData, isLoading, refetch } = useUsers({ limit: 200 });
  const { data: realStats, isLoading: statsLoading } = useUserStats();
  const updateStatus = useUpdateUserStatus();
  const updateSubscription = useUpdateSubscription();

  const users: MemberUser[] = usersData?.data || [];
  const pagination = usersData?.pagination;

  // Client-side search filter by email
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q)
      );
    }

    if (sortByExpiration) {
      result.sort((a, b) => {
        const dateA = a.subscriptionExpiresAt
          ? new Date(a.subscriptionExpiresAt).getTime()
          : Infinity;
        const dateB = b.subscriptionExpiresAt
          ? new Date(b.subscriptionExpiresAt).getTime()
          : Infinity;
        return dateA - dateB;
      });
    }

    return result;
  }, [users, searchQuery, sortByExpiration]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const in7Days = addDays(now, 7);
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const suspended = users.filter((u) => !u.isActive).length;
    const expiringSoon = users.filter((u) => {
      if (!u.subscriptionExpiresAt) return false;
      const exp = new Date(u.subscriptionExpiresAt);
      return isAfter(exp, now) && isBefore(exp, in7Days);
    }).length;
    return { total, active, suspended, expiringSoon };
  }, [users]);

  // Copy email to clipboard
  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success("Email copiado!");
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      toast.error("Erro ao copiar email");
    }
  };

  // Suspend / Reactivate
  const handleStatusChange = async () => {
    if (!confirmAction) return;
    const { user, action } = confirmAction;
    try {
      const result = await updateStatus.mutateAsync({
        id: user.id,
        isActive: action === "reactivate",
      });
      if (action === "suspend") {
        toast.success(`${user.name} foi suspenso`);
      } else {
        const emailSent = (result as any)?.data?.emailSent;
        if (emailSent) {
          toast.success(`Acesso de ${user.name} aprovado! Email de boas-vindas enviado.`);
        } else {
          toast.warning(`${user.name} foi aprovado, mas o email de notificacao falhou. Notifique manualmente.`);
        }
      }
    } catch {
      toast.error("Erro ao alterar status do membro");
    } finally {
      setConfirmAction(null);
    }
  };

  // Change plan (billing period)
  const handleChangePlan = async (user: MemberUser, newPlan: string) => {
    if (newPlan === user.plan) return;
    try {
      await updateSubscription.mutateAsync({ id: user.id, plan: newPlan });
      toast.success(`Plano de ${user.name} alterado para ${newPlan}`);
    } catch {
      toast.error("Erro ao alterar plano");
    }
  };

  // Change plan tier (PRO / DIAMANTE)
  const handleChangePlanTier = async (user: MemberUser, newTier: string) => {
    if (newTier === (user.planTier || 'DIAMANTE')) return;
    try {
      await updateSubscription.mutateAsync({ id: user.id, planTier: newTier });
      toast.success(`Nivel de ${user.name} alterado para ${newTier}`);
    } catch {
      toast.error("Erro ao alterar nivel do plano");
    }
  };

  // Set custom expiration date
  const handleSetExpiration = async () => {
    if (!datePickerUser || !selectedDate) return;
    try {
      await updateSubscription.mutateAsync({
        id: datePickerUser.id,
        expiresAt: selectedDate.toISOString(),
      });
      toast.success(
        `Expiracao de ${datePickerUser.name} definida para ${format(selectedDate, "dd/MM/yyyy")}`
      );
    } catch {
      toast.error("Erro ao definir data de expiracao");
    } finally {
      setDatePickerUser(null);
      setSelectedDate(undefined);
    }
  };

  // Extend +1 month
  const handleExtendOneMonth = async (user: MemberUser) => {
    const baseDate = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : new Date();
    const newDate = addMonths(baseDate, 1);
    try {
      await updateSubscription.mutateAsync({
        id: user.id,
        expiresAt: newDate.toISOString(),
      });
      toast.success(
        `+1 mes para ${user.name} (ate ${format(newDate, "dd/MM/yyyy")})`
      );
    } catch {
      toast.error("Erro ao estender assinatura");
    }
  };

  // Status badge - uses realSubscriptionStatus from backend
  const getStatusBadge = (user: MemberUser) => {
    const status = user.realSubscriptionStatus;
    switch (status) {
      case 'ATIVO':
        return <Badge variant="success">Ativo</Badge>;
      case 'EXPIRADO':
        return <Badge variant="danger">Expirado</Badge>;
      case 'SUSPENSO':
        return <Badge variant="warning">Suspenso</Badge>;
      case 'CANCELADO':
        return <Badge variant="danger">Cancelado</Badge>;
      case 'INATIVO':
        return <Badge variant="warning">Inativo</Badge>;
      case 'SOLICITADO':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Solicitado</Badge>;
      case 'SEM_ASSINATURA':
      default:
        return <Badge variant="default">Sem Assinatura</Badge>;
    }
  };

  // Expiration badge
  const getExpirationBadge = (expiresAt: string | null) => {
    if (!expiresAt) {
      return (
        <span className="text-xs text-muted-foreground italic">Sem data</span>
      );
    }
    const date = new Date(expiresAt);
    const now = new Date();
    const isExpired = isBefore(date, now);
    const isExpiringSoon =
      !isExpired && isBefore(date, addDays(now, 7));
    return (
      <Badge
        variant={isExpired ? "danger" : isExpiringSoon ? "warning" : "default"}
      >
        {format(date, "dd/MM/yyyy")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Gerenciar Membros
            </h2>
            <p className="text-sm text-muted-foreground">
              Painel completo de gestao de membros
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

                        {/* Stats Cards - Based on REAL subscription status */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? '...' : realStats?.totalMembers ?? stats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/15 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {statsLoading ? '...' : realStats?.trulyActive ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Ativos de Verdade</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/15 flex items-center justify-center">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {statsLoading ? '...' : realStats?.expired ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Expirados</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <ShieldOff className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {statsLoading ? '...' : realStats?.suspended ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Suspensos</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {statsLoading ? '...' : realStats?.noSubscription ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Sem Assinatura</p>
            </div>
          </GlassCard>
        </div>

        {/* Search + Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={sortByExpiration ? "default" : "outline"}
            size="sm"
            onClick={() => setSortByExpiration(!sortByExpiration)}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortByExpiration ? "Ordenado por expiracao" : "Ordenar por expiracao"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} de {pagination?.total || users.length} membros
          </span>
        </div>

        {/* Members Table */}
        <GlassCard className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiracao</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {searchQuery
                      ? "Nenhum membro encontrado para essa busca"
                      : "Nenhum membro cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    {/* Nome */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-foreground text-xs font-semibold shrink-0">
                          {user.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          {(user.role === "ADMIN" ||
                            user.role === "SUPER_ADMIN") && (
                            <Badge
                              variant={
                                user.role === "SUPER_ADMIN"
                                  ? "danger"
                                  : "warning"
                              }
                              className="mt-0.5"
                            >
                              {user.role === "SUPER_ADMIN"
                                ? "Super Admin"
                                : "Admin"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* E-mail with copy */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {user.email}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyEmail(user.email)}
                            >
                              {copiedEmail === user.email ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar email</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(user)}</TableCell>

                    {/* Expiracao */}
                    <TableCell>
                      {getExpirationBadge(user.subscriptionExpiresAt)}
                    </TableCell>

                    {/* Plano */}
                    <TableCell>
                      <Select
                        value={user.plan}
                        onValueChange={(val) => handleChangePlan(user, val)}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MENSAL">Mensal</SelectItem>
                          <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                          <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Nivel do Plano */}
                    <TableCell>
                      <Select
                        value={user.planTier || 'DIAMANTE'}
                        onValueChange={(val) => handleChangePlanTier(user, val)}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <div className="flex items-center gap-1.5">
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIAMANTE">Diamante</SelectItem>
                          <SelectItem value="PRO">PRO</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Cadastrado em */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(user.createdAt),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </TableCell>

                    {/* Acoes */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Suspend / Reactivate */}
                        {user.isActive ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-purple-400 border-purple-400/30 hover:bg-purple-400/10 hover:text-purple-300"
                                onClick={() =>
                                  setConfirmAction({
                                    user,
                                    action: "suspend",
                                  })
                                }
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Suspender
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Suspender membro</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-green-400 border-green-400/30 hover:bg-green-400/10 hover:text-green-300"
                                onClick={() =>
                                  setConfirmAction({
                                    user,
                                    action: "reactivate",
                                  })
                                }
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                {user.realSubscriptionStatus === "SOLICITADO" ? "Aprovar" : "Reativar"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{user.realSubscriptionStatus === "SOLICITADO" ? "Aprovar cadastro" : "Reativar membro"}</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Date picker */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => {
                                setDatePickerUser(user);
                                setSelectedDate(
                                  user.subscriptionExpiresAt
                                    ? new Date(user.subscriptionExpiresAt)
                                    : undefined
                                );
                              }}
                            >
                              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                              Data
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Alterar data de expiracao
                          </TooltipContent>
                        </Tooltip>

                        {/* +1 Month */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300"
                              onClick={() => handleExtendOneMonth(user)}
                              disabled={updateSubscription.isPending}
                            >
                              <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                              +1 Mes
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Estender 1 mes a partir da expiracao atual
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination && (
            <div className="p-4 border-t border-border text-sm text-muted-foreground">
              {pagination.total} membros cadastrados
            </div>
          )}
        </GlassCard>

        {/* Confirm Suspend/Reactivate Dialog */}
        <Dialog
          open={!!confirmAction}
          onOpenChange={() => setConfirmAction(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmAction?.action === "suspend"
                  ? "Suspender Membro"
                  : confirmAction?.user.realSubscriptionStatus === "SOLICITADO"
                    ? "Aprovar Cadastro"
                    : "Reativar Membro"}
              </DialogTitle>
              <DialogDescription>
                {confirmAction?.action === "suspend"
                  ? `Tem certeza que deseja suspender ${confirmAction?.user.name}? O membro perdera acesso a plataforma.`
                  : confirmAction?.user.realSubscriptionStatus === "SOLICITADO"
                    ? `Deseja aprovar o cadastro de ${confirmAction?.user.name}? O membro tera acesso a plataforma.`
                    : `Deseja reativar o acesso de ${confirmAction?.user.name}?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
              >
                Cancelar
              </Button>
              <Button
                variant={
                  confirmAction?.action === "suspend"
                    ? "destructive"
                    : "default"
                }
                onClick={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {confirmAction?.action === "suspend"
                  ? "Suspender"
                  : confirmAction?.user.realSubscriptionStatus === "SOLICITADO"
                    ? "Aprovar"
                    : "Reativar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Date Picker Dialog */}
        <Dialog
          open={!!datePickerUser}
          onOpenChange={() => {
            setDatePickerUser(null);
            setSelectedDate(undefined);
          }}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Alterar Data de Expiracao</DialogTitle>
              <DialogDescription>
                Defina a nova data de expiracao para{" "}
                <strong>{datePickerUser?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                initialFocus
              />
            </div>
            {selectedDate && (
              <p className="text-center text-sm text-muted-foreground">
                Nova expiracao:{" "}
                <strong>{format(selectedDate, "dd/MM/yyyy")}</strong>
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDatePickerUser(null);
                  setSelectedDate(undefined);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSetExpiration}
                disabled={!selectedDate || updateSubscription.isPending}
              >
                {updateSubscription.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default MembersTab;
