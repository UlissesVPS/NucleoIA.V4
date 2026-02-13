import { useState, useMemo } from "react";
import { Search, Star, Loader2 } from "lucide-react";
import { AI_TOOL_FILTERS } from "@/constants/filters";
import { AIToolCard } from "@/components/cards";
import { FilterButtons } from "@/components/filters";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionButton, DeleteConfirmDialog } from "@/components/admin";
import AIToolFormDrawer from "@/components/admin/AIToolFormDrawer";
import AIAccessInstructionsModal from "@/components/cards/AIAccessInstructionsModal";
import CanvaAccessModal from "@/components/cards/CanvaAccessModal";
import { toast } from "sonner";
import { useAITools, useCreateAITool, useUpdateAITool, useDeleteAITool } from "@/hooks/useApi";
import type { AITool } from "@/types";

const CATEGORY_UI_TO_API: Record<string, string> = {
  text: 'TEXT', video: 'VIDEO', image: 'IMAGE', voice: 'VOICE',
  design: 'DESIGN', editing: 'EDITING', presentations: 'PRESENTATIONS',
};

const AILibrary = () => {
  const { isAdmin } = useAuth();
  const { data: aiTools = [], isLoading } = useAITools();
  const createAITool = useCreateAITool();
  const updateAITool = useUpdateAITool();
  const deleteAITool = useDeleteAITool();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<AITool | null>(null);

  // Member modal state
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [canvaModalOpen, setCanvaModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);

  // Check if tool is Canva
  const isCanvaTool = (tool: AITool) => tool.name.toLowerCase().includes("canva");

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
    if (isCanvaTool(tool)) {
      setCanvaModalOpen(true);
    } else {
      setInstructionsOpen(true);
    }
  };

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: aiTools.length };
    aiTools.forEach((tool: AITool) => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });
    return counts;
  }, [aiTools]);

  const filteredTools = aiTools.filter((tool: AITool) => {
    const matchesFilter = activeFilter === "all" || tool.category === activeFilter;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddTool = () => {
    setEditingTool(null);
    setFormOpen(true);
  };

  const handleEditTool = (tool: AITool) => {
    setEditingTool(tool);
    setFormOpen(true);
  };

  const handleDeleteClick = (tool: AITool) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (toolToDelete) {
      try {
        await deleteAITool.mutateAsync(toolToDelete.id);
        toast.success(`"${toolToDelete.name}" foi excluído`);
        setDeleteDialogOpen(false);
        setToolToDelete(null);
      } catch (err) {
        toast.error("Erro ao excluir IA");
      }
    }
  };

  const handleFormSubmit = async (toolData: Omit<AITool, "id"> & { id?: string }) => {
    const apiData = {
      name: toolData.name,
      description: toolData.description,
      imageUrl: toolData.image,
      category: CATEGORY_UI_TO_API[toolData.category] || toolData.category,
      unlimited: toolData.unlimited,
    };

    try {
      if (toolData.id) {
        await updateAITool.mutateAsync({ id: toolData.id, ...apiData });
        toast.success(`"${toolData.name}" foi atualizado`);
      } else {
        await createAITool.mutateAsync(apiData);
        toast.success(`"${toolData.name}" foi adicionado`);
      }
    } catch (err) {
      toast.error("Erro ao salvar IA");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header Card */}
      <GlassCard className="border border-border">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Badge variant="success" className="flex items-center gap-1.5">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            <span className="text-xs sm:text-sm">Acesso Ilimitado</span>
          </Badge>
          <span className="text-muted-foreground hidden xs:inline">•</span>
          <span className="text-xs sm:text-sm text-muted-foreground">{aiTools.length} ferramentas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Biblioteca de IAs</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Lista completa das ferramentas disponíveis no seu plano.
        </p>
      </GlassCard>

      {/* Search */}
      <InputWithIcon
        icon={Search}
        placeholder="Buscar ferramentas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:max-w-xl"
      />

      {/* Filters - Horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
        <FilterButtons
          filters={AI_TOOL_FILTERS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
      </div>

      {/* Count */}
      <p className="text-xs sm:text-sm text-muted-foreground">{filteredTools.length} ferramentas encontradas</p>

      {/* Grid - Responsive columns */}
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 auto-rows-fr">
        {filteredTools.map((tool: AITool, index: number) => (
          <div key={tool.id} className="h-full">
            <AIToolCard
              tool={tool}
              index={index}
              showAdminActions={isAdmin}
              onEdit={() => handleEditTool(tool)}
              onDelete={() => handleDeleteClick(tool)}
              onClick={() => handleToolClick(tool)}
            />
          </div>
        ))}
      </div>

      {/* Admin FAB */}
      {isAdmin && (
        <FloatingActionButton onClick={handleAddTool} label="Nova IA" />
      )}

      {/* Admin Form Drawer */}
      <AIToolFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        tool={editingTool}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir IA"
        itemName={toolToDelete?.name}
      />

      {/* Member Instructions Modal - Default */}
      <AIAccessInstructionsModal
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        tool={selectedTool}
      />

      {/* Member Instructions Modal - Canva Specific */}
      <CanvaAccessModal
        open={canvaModalOpen}
        onOpenChange={setCanvaModalOpen}
        tool={selectedTool}
      />
    </div>
  );
};

export default AILibrary;
