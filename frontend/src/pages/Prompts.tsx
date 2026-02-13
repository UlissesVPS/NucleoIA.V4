import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Copy, Heart, Image, Video, X, Sparkles, Zap, Clock, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PROMPT_FILTERS } from "@/constants/filters";
import { FilterButtons } from "@/components/filters";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionButton, CardAdminActions, DeleteConfirmDialog, PromptFormDrawer } from "@/components/admin";
import { usePromptsPaginated, useCategories, useCreatePrompt, useUpdatePrompt, useDeletePrompt, useLikePrompt, useCopyPrompt } from "@/hooks/useApi";
import type { Prompt } from "@/types";

const ITEMS_PER_PAGE = 24;

const Prompts = () => {
  const { isAdmin } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedPrompt, setExpandedPrompt] = useState<Prompt | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeFilter, selectedCategory]);

  // Build API params
  const apiParams: Record<string, unknown> = { page, limit: ITEMS_PER_PAGE };
  if (activeFilter !== "all") apiParams.type = activeFilter.toUpperCase();
  if (selectedCategory) apiParams.category = selectedCategory;  // sends categoryId
  if (debouncedSearch) apiParams.search = debouncedSearch;

  // API hooks
  const { data: promptsResponse, isLoading, isFetching } = usePromptsPaginated(apiParams);
  const { data: categories = [] } = useCategories();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();
  const likePrompt = useLikePrompt();
  const copyPrompt = useCopyPrompt();

  const prompts = promptsResponse?.data || [];
  const meta = promptsResponse?.meta || { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 };
  const totalPages = meta.totalPages || 1;

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
        await createPrompt.mutateAsync(apiData as any);
        toast.success(`"${promptData.title}" foi criado`);
      }
    } catch {
      toast.error("Erro ao salvar prompt");
    }
  };

  // Build page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Category options from API (value=id, label=name)
  const categoryOptions = categories.map((c: any) => ({ id: c.id || c, name: c.name || c })).filter((c: any) => c.name);

  if (isLoading && !prompts.length) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Biblioteca de Prompts</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {meta.total > 0 ? `${meta.total.toLocaleString('pt-BR')} prompts disponíveis` : 'Milhares de prompts prontos para usar'}
        </p>
      </div>

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
            <option value="">Todas as Categorias</option>
            {categoryOptions.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      {/* Loading overlay for page transitions */}
      <div className="relative">
        {isFetching && prompts.length > 0 && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {prompts.map((prompt: Prompt) => (
            <GlassCard
              key={prompt.id}
              className="p-0 overflow-hidden cursor-pointer group relative"
              hover
              onClick={() => setExpandedPrompt(prompt)}
            >
              {isAdmin && (
                <CardAdminActions
                  onEdit={() => handleEditPrompt(prompt)}
                  onDelete={() => handleDeleteClick(prompt)}
                />
              )}

              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={prompt.thumbnail}
                  alt={prompt.title}
                  loading="lazy"
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
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-1 text-xs text-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Clique para expandir
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{prompt.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{prompt.category}</p>

                <div className="flex items-center justify-between">
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={(e) => handleCopy(prompt, e)}
                  >
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
          ))}
        </div>
      </div>

      {prompts.length === 0 && !isFetching && (
        <div className="text-center py-12 sm:py-16">
          <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Nenhum prompt encontrado</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {searchQuery ? "Tente outra busca" : "Nenhum prompt disponível no momento"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, meta.total)} de {meta.total.toLocaleString('pt-BR')} prompts
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, i) =>
              typeof p === "string" ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="min-w-[36px]"
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <FloatingActionButton onClick={handleAddPrompt} label="Novo Prompt" />
      )}

      {/* Modal - z-[100] to stay above header */}
      {expandedPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpandedPrompt(null)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-50 blur-sm" />
            <div className="relative bg-card rounded-2xl overflow-hidden border border-border">
              <div className="relative h-48 sm:h-64 md:h-80">
                <img src={expandedPrompt.thumbnail} alt={expandedPrompt.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <button
                  onClick={() => setExpandedPrompt(null)}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10"
                >
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
                {expandedPrompt.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Sobre este prompt
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{expandedPrompt.description}</p>
                  </div>
                )}

                {expandedPrompt.tags && expandedPrompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expandedPrompt.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">#{tag}</span>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Prompt Completo
                  </h3>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-50" />
                    <div className="relative bg-muted/50 rounded-xl p-4 border border-border">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed max-h-[50vh] overflow-y-auto">
                        {expandedPrompt.promptText || expandedPrompt.content || "Conteúdo não disponível"}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="gradient" size="lg" className="flex-1 sm:flex-none" onClick={() => handleCopy(expandedPrompt)}>
                    <Copy className="h-5 w-5 mr-2" />
                    Copiar Prompt
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={() => handleLike(expandedPrompt)}>
                    <Heart className="h-5 w-5 mr-2" />
                    Adicionar aos Favoritos
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

export default Prompts;
