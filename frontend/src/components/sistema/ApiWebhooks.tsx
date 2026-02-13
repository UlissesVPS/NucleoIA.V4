import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Webhook,
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Pencil,
  Play,
  Pause,
  TestTube,
  Check,
  X,
  AlertTriangle,
  Shield,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useApiKeys, useCreateApiKey, useRevokeApiKey,
  useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook,
} from "@/hooks/useApi";

const webhookEvents = [
  {
    category: "Usuarios",
    events: [
      { value: "user.created", label: "user.created" },
      { value: "user.updated", label: "user.updated" },
      { value: "user.deleted", label: "user.deleted" },
    ],
  },
  {
    category: "Prompts",
    events: [
      { value: "prompt.created", label: "prompt.created" },
      { value: "prompt.updated", label: "prompt.updated" },
      { value: "prompt.deleted", label: "prompt.deleted" },
      { value: "prompt.imported", label: "prompt.imported (lote)" },
    ],
  },
  {
    category: "Assinaturas",
    events: [
      { value: "subscription.created", label: "subscription.created" },
      { value: "subscription.expired", label: "subscription.expired" },
      { value: "subscription.canceled", label: "subscription.canceled" },
    ],
  },
  {
    category: "Cursos",
    events: [
      { value: "course.created", label: "course.created" },
      { value: "lesson.completed", label: "lesson.completed" },
    ],
  },
  {
    category: "Sistema",
    events: [
      { value: "system.backup", label: "system.backup" },
      { value: "system.alert", label: "system.alert" },
      { value: "import.completed", label: "import.completed" },
    ],
  },
];

const apiEndpoints = [
  {
    method: "GET", path: "/api/prompts", description: "Listar todos os prompts",
    params: [
      { name: "page", type: "number", desc: "Pagina (default: 1)" },
      { name: "limit", type: "number", desc: "Itens por pagina (default: 20)" },
    ],
    response: `{ "data": [...], "meta": { "total": 2588, "page": 1, "limit": 20 } }`,
  },
  {
    method: "POST", path: "/api/prompts", description: "Criar novo prompt",
    body: `{ "title": "...", "content": "...", "type": "image", "categoryId": "..." }`,
    response: `{ "success": true, "data": { "id": "...", "title": "..." } }`,
  },
  {
    method: "GET", path: "/api/categories", description: "Listar categorias",
    response: `{ "data": [{ "id": "...", "name": "Retrato", "_count": { "prompts": 450 } }] }`,
  },
  {
    method: "GET", path: "/api/system/stats", description: "Estatisticas gerais",
    response: `{ "data": { "users": { "total": 312 }, "content": { "prompts": 2588 } } }`,
  },
];

const ApiWebhooks = () => {
  const [activeSubTab, setActiveSubTab] = useState("keys");

  // API Keys state & hooks
  const { data: apiKeys = [], isLoading: keysLoading } = useApiKeys();
  const createKeyMut = useCreateApiKey();
  const revokeKeyMut = useRevokeApiKey();

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [newKeyForm, setNewKeyForm] = useState({
    name: "",
    type: "CUSTOM",
    permissions: ["read"],
    expiration: "none",
  });
  const [revokeConfirm, setRevokeConfirm] = useState<any>(null);

  // Webhooks state & hooks
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhooks();
  const createWebhookMut = useCreateWebhook();
  const updateWebhookMut = useUpdateWebhook();
  const deleteWebhookMut = useDeleteWebhook();
  const testWebhookMut = useTestWebhook();

  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [testingWebhook, setTestingWebhook] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", event: "" });
  const [deleteWebhookConfirm, setDeleteWebhookConfirm] = useState<any>(null);

  // API Keys handlers
  const toggleKeyVisibility = useCallback((id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  }, []);

  const handleGenerateKey = useCallback(async () => {
    const expiresMap: Record<string, string | null> = {
      "30d": new Date(Date.now() + 30 * 86400000).toISOString(),
      "90d": new Date(Date.now() + 90 * 86400000).toISOString(),
      "1y": new Date(Date.now() + 365 * 86400000).toISOString(),
      "none": null,
    };
    try {
      const result = await createKeyMut.mutateAsync({
        name: newKeyForm.name || "Nova Chave",
        type: newKeyForm.type,
        permissions: newKeyForm.permissions,
        expiresAt: expiresMap[newKeyForm.expiration],
      });
      setGeneratedKey(result.data);
      toast.success("Chave criada!");
    } catch {
      toast.error("Erro ao criar chave");
    }
  }, [newKeyForm, createKeyMut]);

  const handleRevokeKey = useCallback(async () => {
    if (!revokeConfirm) return;
    try {
      await revokeKeyMut.mutateAsync(revokeConfirm.id);
      toast.success("Chave revogada!");
    } catch {
      toast.error("Erro ao revogar chave");
    }
    setRevokeConfirm(null);
  }, [revokeConfirm, revokeKeyMut]);

  // Webhook handlers
  const handleSaveWebhook = useCallback(async () => {
    try {
      if (editingWebhook) {
        await updateWebhookMut.mutateAsync({
          id: editingWebhook.id,
          name: webhookForm.name,
          url: webhookForm.url,
          event: webhookForm.event,
        });
        toast.success("Webhook atualizado!");
      } else {
        await createWebhookMut.mutateAsync({
          name: webhookForm.name,
          url: webhookForm.url,
          event: webhookForm.event,
        });
        toast.success("Webhook criado!");
      }
      setWebhookModalOpen(false);
      setEditingWebhook(null);
      setWebhookForm({ name: "", url: "", event: "" });
    } catch {
      toast.error("Erro ao salvar webhook");
    }
  }, [webhookForm, editingWebhook, updateWebhookMut, createWebhookMut]);

  const toggleWebhookStatus = useCallback(async (webhook: any) => {
    try {
      await updateWebhookMut.mutateAsync({
        id: webhook.id,
        status: webhook.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
      });
      toast.success(webhook.status === "ACTIVE" ? "Webhook pausado" : "Webhook ativado");
    } catch {
      toast.error("Erro ao alterar status");
    }
  }, [updateWebhookMut]);

  const handleTestWebhook = useCallback(async () => {
    if (!testingWebhook) return;
    setTestResult(null);
    try {
      const result = await testWebhookMut.mutateAsync(testingWebhook.id);
      setTestResult(result.data);
    } catch {
      setTestResult({ status: 0, ok: false });
    }
  }, [testingWebhook, testWebhookMut]);

  const handleDeleteWebhook = useCallback(async () => {
    if (!deleteWebhookConfirm) return;
    try {
      await deleteWebhookMut.mutateAsync(deleteWebhookConfirm.id);
      toast.success("Webhook excluido!");
    } catch {
      toast.error("Erro ao excluir webhook");
    }
    setDeleteWebhookConfirm(null);
  }, [deleteWebhookConfirm, deleteWebhookMut]);

  const openEditWebhook = useCallback((webhook: any) => {
    setEditingWebhook(webhook);
    setWebhookForm({ name: webhook.name, url: webhook.url, event: webhook.event });
    setWebhookModalOpen(true);
  }, []);

  const maskKey = (prefix: string) => prefix + "••••••••••••••••••••";

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-success/20 text-success border-success/30",
      POST: "bg-primary/20 text-primary border-primary/30",
      PUT: "bg-warning/20 text-warning border-warning/30",
      DELETE: "bg-destructive/20 text-destructive border-destructive/30",
    };
    return colors[method] || "bg-muted text-muted-foreground";
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Ativo";
      case "PAUSED": return "Pausado";
      case "ERROR": return "Erro";
      case "REVOKED": return "Revogada";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start bg-transparent border-b border-white/10 rounded-none p-0 h-auto">
            <TabsTrigger value="keys" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <Key className="h-4 w-4" />
              <span className="text-sm font-medium">Chaves de API</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <Webhook className="h-4 w-4" />
              <span className="text-sm font-medium">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Documentacao</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Chaves de API
              </h3>
              <p className="text-sm text-muted-foreground">Gerencie as chaves de acesso a API</p>
            </div>
            <Button onClick={() => { setNewKeyModalOpen(true); setGeneratedKey(null); }} className="gap-2">
              <Plus className="h-4 w-4" /> Gerar Nova Chave
            </Button>
          </div>

          {keysLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((keyItem: any) => (
                <motion.div
                  key={keyItem.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-all",
                    keyItem.status === "REVOKED" ? "border-white/5 opacity-60" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">{keyItem.name}</h4>
                        <Badge className={cn("text-xs", keyItem.type === "PRODUCTION" ? "bg-success/20 text-success border-success/30" : "bg-primary/20 text-primary border-primary/30")}>
                          {keyItem.type}
                        </Badge>
                        <Badge className={cn("text-xs", keyItem.status === "ACTIVE" ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", keyItem.status === "ACTIVE" ? "bg-success" : "bg-destructive")} />
                          {getStatusLabel(keyItem.status)}
                        </Badge>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground">
                        {maskKey(keyItem.keyPrefix || "nuc_")}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criada: {formatDate(keyItem.createdAt)}
                        </span>
                        {keyItem.expiresAt && (
                          <span>Expira: {formatDate(keyItem.expiresAt)}</span>
                        )}
                      </div>
                    </div>

                    {keyItem.status === "ACTIVE" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(keyItem.keyPrefix)} className="gap-1.5">
                          <Copy className="h-4 w-4" /> Copiar Prefix
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setRevokeConfirm(keyItem)}
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" /> Revogar
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {apiKeys.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Nenhuma chave de API cadastrada.</div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 p-4 rounded-lg bg-warning/5 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Mantenha suas chaves seguras.</span>{" "}
              Nunca compartilhe em codigo publico ou repositorios. Regenere imediatamente se comprometida.
            </p>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Webhooks
              </h3>
              <p className="text-sm text-muted-foreground">Receba notificacoes em tempo real sobre eventos da plataforma</p>
            </div>
            <Button
              onClick={() => {
                setEditingWebhook(null);
                setWebhookForm({ name: "", url: "", event: "" });
                setWebhookModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo Webhook
            </Button>
          </div>

          {webhooksLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook: any) => (
                <motion.div
                  key={webhook.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-all",
                    webhook.status === "PAUSED" ? "border-white/5 opacity-70" : webhook.status === "ERROR" ? "border-destructive/30" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{webhook.name}</h4>
                          <Badge className={cn("text-xs",
                            webhook.status === "ACTIVE" ? "bg-success/20 text-success border-success/30"
                            : webhook.status === "PAUSED" ? "bg-muted text-muted-foreground"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5",
                              webhook.status === "ACTIVE" ? "bg-success" : webhook.status === "PAUSED" ? "bg-muted-foreground" : "bg-destructive"
                            )} />
                            {getStatusLabel(webhook.status)}
                          </Badge>
                          {webhook.lastStatus && (
                            <Badge className={cn("text-xs",
                              webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
                            )}>
                              {webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? "OK" : "ERR"} {webhook.lastStatus}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-primary font-medium">POST</span>
                          <span className="text-muted-foreground font-mono text-xs truncate">{webhook.url}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Evento: <code className="bg-muted px-1 py-0.5 rounded">{webhook.event}</code></span>
                          <span>Ultimo: {formatDateTime(webhook.lastFired)}</span>
                          {webhook.failures > 0 && <span className="text-warning">{webhook.failures} falhas</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => openEditWebhook(webhook)} className="gap-1.5">
                        <Pencil className="h-4 w-4" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setTestingWebhook(webhook); setTestResult(null); }} className="gap-1.5">
                        <TestTube className="h-4 w-4" /> Testar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleWebhookStatus(webhook)} className="gap-1.5">
                        {webhook.status === "ACTIVE" ? <><Pause className="h-4 w-4" /> Desativar</> : <><Play className="h-4 w-4" /> Ativar</>}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteWebhookConfirm(webhook)} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {webhooks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Nenhum webhook cadastrado.</div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentacao da API
            </h3>
            <p className="text-sm text-muted-foreground">Referencia dos endpoints disponiveis</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Base URL:</span>
              <code className="bg-muted px-2 py-1 rounded font-mono text-sm text-foreground">https://painel.nucleoia.online/api</code>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard("https://painel.nucleoia.online/api")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Autenticacao</h4>
            </div>
            <p className="text-sm text-muted-foreground">Todas as requisicoes devem incluir o header de autorizacao:</p>
            <div className="bg-[#0f0f12] rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-muted-foreground">Authorization:</span> <span className="text-primary">Bearer</span> <span className="text-foreground">{"{API_KEY}"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h4 className="font-semibold text-foreground">Endpoints Disponiveis</h4>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {apiEndpoints.map((endpoint, idx) => (
                <AccordionItem key={idx} value={`endpoint-${idx}`} className="border-white/10">
                  <AccordionTrigger className="px-4 hover:bg-white/5 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs font-mono", getMethodBadge(endpoint.method))}>{endpoint.method}</Badge>
                      <code className="font-mono text-sm text-foreground">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {endpoint.params && (
                        <div>
                          <h5 className="text-sm font-medium text-foreground mb-2">Parametros</h5>
                          <div className="space-y-1">
                            {endpoint.params.map((param, i) => (
                              <div key={i} className="flex items-baseline gap-2 text-sm">
                                <code className="bg-muted px-1.5 py-0.5 rounded text-primary">{param.name}</code>
                                <span className="text-muted-foreground text-xs">({param.type})</span>
                                <span className="text-muted-foreground">— {param.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {endpoint.body && (
                        <div>
                          <h5 className="text-sm font-medium text-foreground mb-2">Body</h5>
                          <pre className="bg-[#0f0f12] rounded-lg p-4 font-mono text-xs overflow-x-auto text-foreground">{endpoint.body}</pre>
                        </div>
                      )}
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-2">Response</h5>
                        <pre className="bg-[#0f0f12] rounded-lg p-4 font-mono text-xs overflow-x-auto text-foreground">{endpoint.response}</pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      {/* New API Key Modal */}
      <Dialog open={newKeyModalOpen} onOpenChange={(open) => { if (!open) { setNewKeyModalOpen(false); setGeneratedKey(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {generatedKey ? "Chave Gerada" : "Gerar Nova Chave"}
            </DialogTitle>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm text-foreground font-medium mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Chave gerada com sucesso!
                </p>
                <p className="text-xs text-muted-foreground">Copie agora, esta chave nao sera mostrada novamente.</p>
              </div>
              <div className="space-y-2">
                <Label>Sua nova chave:</Label>
                <div className="flex items-center gap-2">
                  <Input value={generatedKey.rawKey || ""} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedKey.rawKey || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => { setNewKeyModalOpen(false); setGeneratedKey(null); }}>Entendido</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nome da chave</Label>
                <Input id="key-name" value={newKeyForm.name} onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })} placeholder="Ex: Integracao Zapier" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newKeyForm.type} onValueChange={(v) => setNewKeyForm({ ...newKeyForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Producao</SelectItem>
                    <SelectItem value="TEST">Teste</SelectItem>
                    <SelectItem value="IMPORT">Importador</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissoes</Label>
                <Select value={newKeyForm.permissions.join(",")} onValueChange={(v) => setNewKeyForm({ ...newKeyForm, permissions: v.split(",") })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Leitura</SelectItem>
                    <SelectItem value="read,write">Leitura e Escrita</SelectItem>
                    <SelectItem value="read,write,admin">Admin (Completo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiracao</Label>
                <Select value={newKeyForm.expiration} onValueChange={(v) => setNewKeyForm({ ...newKeyForm, expiration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                    <SelectItem value="1y">1 ano</SelectItem>
                    <SelectItem value="none">Sem expiracao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setNewKeyModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerateKey} disabled={createKeyMut.isPending} className="gap-2">
                  {createKeyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  Gerar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation */}
      <AlertDialog open={!!revokeConfirm} onOpenChange={() => setRevokeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar a chave "{revokeConfirm?.name}"? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Webhook Modal */}
      <Dialog open={webhookModalOpen} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Nome</Label>
              <Input id="webhook-name" value={webhookForm.name} onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })} placeholder="Ex: Notificacao de novo membro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL de destino</Label>
              <Input id="webhook-url" value={webhookForm.url} onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Evento</Label>
              <Select value={webhookForm.event} onValueChange={(v) => setWebhookForm({ ...webhookForm, event: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
                <SelectContent>
                  {webhookEvents.map((category) => (
                    <div key={category.category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category.category}</div>
                      {category.events.map((event) => (
                        <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setWebhookModalOpen(false); setEditingWebhook(null); }}>Cancelar</Button>
              <Button onClick={handleSaveWebhook} disabled={!webhookForm.name || !webhookForm.url || !webhookForm.event || createWebhookMut.isPending || updateWebhookMut.isPending} className="gap-2">
                {(createWebhookMut.isPending || updateWebhookMut.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingWebhook ? "Salvar" : "Criar Webhook"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Modal */}
      <Dialog open={!!testingWebhook} onOpenChange={() => { setTestingWebhook(null); setTestResult(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" /> Testar Webhook
            </DialogTitle>
            <DialogDescription>Enviar um payload de teste para {testingWebhook?.url}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">Payload de teste:</p>
              <pre className="bg-[#0f0f12] rounded p-3 font-mono text-xs overflow-x-auto text-foreground">
{JSON.stringify({ event: "test", timestamp: new Date().toISOString() }, null, 2)}
              </pre>
            </div>
            {testResult && (
              <div className={cn("rounded-lg p-4", testResult.ok ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20")}>
                <div className="flex items-center gap-3">
                  <Badge className={cn(testResult.ok ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30")}>
                    {testResult.ok ? "OK" : "ERR"} {testResult.status}
                  </Badge>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setTestingWebhook(null); setTestResult(null); }}>Fechar</Button>
              <Button onClick={handleTestWebhook} disabled={testWebhookMut.isPending} className="gap-2">
                {testWebhookMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4" /> Enviar Teste</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Confirmation */}
      <AlertDialog open={!!deleteWebhookConfirm} onOpenChange={() => setDeleteWebhookConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o webhook "{deleteWebhookConfirm?.name}"? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWebhook} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApiWebhooks;
