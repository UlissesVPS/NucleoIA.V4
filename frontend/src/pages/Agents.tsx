import { useState, useMemo } from "react";
import { Search, Users, Loader2 } from "lucide-react";
import { AgentCard } from "@/components/cards";
import { FilterButtons } from "@/components/filters";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionButton, DeleteConfirmDialog, AgentFormDrawer } from "@/components/admin";
import { toast } from "sonner";
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "@/hooks/useApi";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import UpgradeScreen from "@/components/UpgradeScreen";
import type { FilterOption } from "@/constants/filters";

interface Agent {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  externalUrl: string;
  badge?: string | null;
  isActive: boolean;
  order: number;
}

const AGENT_FILTERS: FilterOption[] = [
  { id: "all", label: "Todos" },
  { id: "INFLUENCER", label: "Influencer" },
  { id: "MARKETING", label: "Marketing" },
  { id: "CONTEUDO", label: "Conteudo" },
  { id: "VENDAS", label: "Vendas" },
  { id: "DESIGN", label: "Design" },
  { id: "GERAL", label: "Geral" },
];

const Agents = () => {
  const { isAdmin } = useAuth();
  const { data: agents = [], isLoading } = useAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const { canAccessAgents } = usePlanAccess();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length };
    agents.forEach((agent: Agent) => {
      counts[agent.category] = (counts[agent.category] || 0) + 1;
    });
    return counts;
  }, [agents]);

  const filteredAgents = agents.filter((agent: Agent) => {
    const matchesFilter = activeFilter === "all" || agent.category === activeFilter;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddAgent = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (agentToDelete) {
      try {
        await deleteAgent.mutateAsync(agentToDelete.id);
        toast.success(`"${agentToDelete.name}" foi excluido`);
        setDeleteDialogOpen(false);
        setAgentToDelete(null);
      } catch {
        toast.error("Erro ao excluir agente");
      }
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const { id, ...rest } = data;
    try {
      if (id) {
        await updateAgent.mutateAsync({ id: id as string, ...rest });
        toast.success(`"${rest.name}" foi atualizado`);
      } else {
        await createAgent.mutateAsync(rest);
        toast.success(`"${rest.name}" foi adicionado`);
      }
    } catch {
      toast.error("Erro ao salvar agente");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Plan access guard
  if (!canAccessAgents) return <UpgradeScreen feature="Agentes" />;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header Card */}
      <GlassCard className="border border-border">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Badge variant="success" className="flex items-center gap-1.5">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-xs sm:text-sm">Agentes GPT</span>
          </Badge>
          <span className="text-muted-foreground hidden xs:inline">&middot;</span>
          <span className="text-xs sm:text-sm text-muted-foreground">{agents.length} agentes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Agentes IA</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Agentes inteligentes criados com GPT para automatizar tarefas e gerar conteudo.
        </p>
      </GlassCard>

      {/* Search */}
      <InputWithIcon
        icon={Search}
        placeholder="Buscar agentes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:max-w-xl"
      />

      {/* Filters */}
      <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
        <FilterButtons
          filters={AGENT_FILTERS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
      </div>

      {/* Count */}
      <p className="text-xs sm:text-sm text-muted-foreground">{filteredAgents.length} agentes encontrados</p>

      {/* Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 auto-rows-fr">
          {filteredAgents.map((agent: Agent, index: number) => (
            <div key={agent.id} className="h-full">
              <AgentCard
                agent={agent}
                index={index}
                showAdminActions={isAdmin}
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => handleDeleteClick(agent)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum agente encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Tente buscar com outros termos." : "Agentes serao adicionados em breve."}
          </p>
        </div>
      )}

      {/* Admin FAB */}
      {isAdmin && (
        <FloatingActionButton onClick={handleAddAgent} label="Novo Agente" />
      )}

      {/* Admin Form Drawer */}
      <AgentFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        agent={editingAgent}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Agente"
        itemName={agentToDelete?.name}
      />
    </div>
  );
};

export default Agents;
