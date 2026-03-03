import { useState } from "react";
import { Search, Copy, Heart, Image, Video, X, Sparkles, Zap, Clock, User, Plus, PenLine, Loader2, Globe, Lock } from "lucide-react";
import { PROMPT_FILTERS, PROMPT_CATEGORIES } from "@/constants/filters";
import { FilterButtons } from "@/components/filters";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Prompt } from "@/types";
import PromptFormDrawer from "@/components/admin/PromptFormDrawer";
import { CardAdminActions, DeleteConfirmDialog } from "@/components/admin";
import { usePrompts, useMyPrompts, useCreateCommunityPrompt, useUpdateMyPrompt, useDeleteMyPrompt, useLikePrompt, useCopyPrompt, useCategories, useTogglePromptPublic } from "@/hooks/useApi";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import UpgradeScreen from "@/components/UpgradeScreen";

const MyPrompts = () => {
  const { isAdmin, user } = useAuth();
  const { canAccessPrompts } = usePlanAccess();
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("Todas as Categorias");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrompt, setExpandedPrompt] = useState<Prompt | null>(null);
  
  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

  // API hooks
  const { data: allPrompts = [], isLoading: loadingAll } = usePrompts();
  const { data: myPrompts = [], isLoading: loadingMine } = useMyPrompts();
  const createCommunityPrompt = useCreateCommunityPrompt();
  const updatePrompt = useUpdateMyPrompt();
  const deletePrompt = useDeleteMyPrompt();
  const likePrompt = useLikePrompt();
  const copyPrompt = useCopyPrompt();
  const { data: categories = [] } = useCategories();
  const togglePublic = useTogglePromptPublic();

  const isLoading = activeTab === "mine" ? loadingMine : loadingAll;
  const displayedPrompts = activeTab === "mine" ? myPrompts : allPrompts;

  const filteredPrompts = displayedPrompts.filter((prompt) => {
    const matchesFilter = activeFilter === "all" || prompt.type === activeFilter;
    const matchesCategory = selectedCategory === "Todas as Categorias" || prompt.category === selectedCategory;
    const matchesSearch = !searchQuery || prompt.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const handleCopy = async (prompt: Prompt, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(prompt.promptText);
    try {
      await copyPrompt.mutateAsync(String(prompt.id));
    } catch {}
    toast.success(`Prompt "${prompt.title}" copiado!`);
  };

  const handleLike = async (prompt: Prompt, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await likePrompt.mutateAsync(String(prompt.id));
      toast.success(`"${prompt.title}" curtido!`);
    } catch {
      toast.error("Erro ao curtir prompt");
    }
  };

  const canEditPrompt = (prompt: Prompt) => {
    if (isAdmin) return true;
    return (prompt as any).authorId === user?.id;
  };

  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setFormOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormOpen(true);
  };

  const handleDeleteClick = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (promptToDelete) {
      try {
        await deletePrompt.mutateAsync(String(promptToDelete.id));
        toast.success(`"${promptToDelete.title}" foi excluído`);
      } catch {
        toast.error("Erro ao excluir prompt");
      }
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleFormSubmit = async (promptData: Partial<Prompt>) => {
    try {
      const apiData = {
        ...promptData,
        content: promptData.promptText || (promptData as any).content,
        thumbnailUrl: promptData.thumbnail || (promptData as any).thumbnailUrl,
      };
      if (promptData.id) {
        await updatePrompt.mutateAsync({ id: String(promptData.id), ...apiData } as any);
        toast.success(`"${promptData.title}" foi atualizado`);
      } else {
        await createCommunityPrompt.mutateAsync(apiData as any);
        toast.success(`"${promptData.title}" foi criado`);
      }
    } catch {
      toast.error("Erro ao salvar prompt");
    }
  };

  // Plan access guard
  if (!canAccessPrompts) return <UpgradeScreen feature="Meus Prompts" />;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Meus Prompts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Crie e gerencie seus próprios prompts</p>
        </div>
        <Button variant="gradient" onClick={handleAddPrompt} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Criar Meu Prompt
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">Todos da Comunidade</TabsTrigger>
          <TabsTrigger value="mine">Apenas Meus</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
          <FilterButtons
            filters={PROMPT_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full xs:w-auto"
          >
            {PROMPT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <InputWithIcon
            icon={Search}
            placeholder="Buscar prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full xs:w-48 sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {filteredPrompts.map((prompt) => {
            const canEdit = canEditPrompt(prompt);
            
            return (
              <GlassCard
                key={prompt.id}
                className="p-0 overflow-hidden cursor-pointer group relative"
                hover
                onClick={() => setExpandedPrompt(prompt)}
              >
                {canEdit && (
                  <CardAdminActions
                    onEdit={() => handleEditPrompt(prompt)}
                    onDelete={() => handleDeleteClick(prompt)}
                  />
                )}

                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={prompt.thumbnail}
                    alt={prompt.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge
                    className="absolute top-3 right-3"
                    variant={prompt.type === "video" ? "warning" : "default"}
                  >
                    {prompt.type === "video" ? (
                      <><Video className="h-3 w-3 mr-1" /> VÍDEO</>
                    ) : (
                      <><Image className="h-3 w-3 mr-1" /> IMAGEM</>
                    )}
                  </Badge>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{prompt.title}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{prompt.category}</p>
                    {activeTab === "mine" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublic.mutateAsync(String(prompt.id)).then((res) => {
                            toast.success(res.message);
                          }).catch(() => toast.error('Erro ao alterar visibilidade'));
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${(prompt as any).isCommunity ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                      >
                        {(prompt as any).isCommunity ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {(prompt as any).isCommunity ? 'Publico' : 'Privado'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="gradient" size="sm" onClick={(e) => handleCopy(prompt, e)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => handleLike(prompt, e)}>
                      <Heart className="h-4 w-4 mr-1" />
                      {prompt.likes}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {!isLoading && filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <PenLine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum prompt encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === "mine" ? "Você ainda não criou nenhum prompt." : "Nenhum prompt corresponde aos filtros."}
          </p>
          {activeTab === "mine" && (
            <Button variant="gradient" onClick={handleAddPrompt}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Meu Primeiro Prompt
            </Button>
          )}
        </div>
      )}

      {expandedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setExpandedPrompt(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 rounded-t-2xl sm:rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-50 blur-sm" />
            <div className="relative bg-card rounded-t-2xl sm:rounded-2xl overflow-hidden border-t sm:border border-border">
              <div className="relative h-48 sm:h-64 md:h-80">
                <img src={expandedPrompt.thumbnail} alt={expandedPrompt.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <button onClick={() => setExpandedPrompt(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors">
                  <X className="h-5 w-5" />
                </button>
                <Badge className="absolute top-4 left-4" variant={expandedPrompt.type === "video" ? "warning" : "default"}>
                  {expandedPrompt.type === "video" ? <><Video className="h-3 w-3 mr-1" /> VÍDEO</> : <><Image className="h-3 w-3 mr-1" /> IMAGEM</>}
                </Badge>
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{expandedPrompt.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" />{expandedPrompt.author}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{expandedPrompt.createdAt}</span>
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-destructive" />{expandedPrompt.likes} curtidas</span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />Sobre este prompt
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{expandedPrompt.description}</p>
                </div>
                {expandedPrompt.tags && expandedPrompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expandedPrompt.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">#{tag}</span>
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />Prompt Completo
                  </h3>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-50" />
                    <div className="relative bg-muted/50 rounded-xl p-4 border border-border">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">{expandedPrompt.promptText}</pre>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="gradient" size="lg" className="flex-1 sm:flex-none" onClick={() => handleCopy(expandedPrompt)}>
                    <Copy className="h-5 w-5 mr-2" />Copiar Prompt
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={() => handleLike(expandedPrompt)}>
                    <Heart className="h-5 w-5 mr-2" />Adicionar aos Favoritos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PromptFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        prompt={editingPrompt}
        onSubmit={handleFormSubmit}
        categories={categories}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Prompt"
        itemName={promptToDelete?.title}
      />
    </div>
  );
};

export default MyPrompts;
