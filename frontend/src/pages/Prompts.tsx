import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Search, Copy, Heart, Image, Video, X, Sparkles,
    User, Loader2, ChevronLeft, ChevronRight, Check,
    Star, TrendingUp, Bookmark, Trash2, CheckSquare, Square, XSquare,
    ChevronDown, ChevronUp,
} from "lucide-react";
import { PROMPT_FILTERS } from "@/constants/filters";
import { FilterButtons } from "@/components/filters";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
    FloatingActionButton, CardAdminActions, PromptFormDrawer,
} from "@/components/admin";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import {
    usePromptsPaginated, useCategories, useCreatePrompt, useUpdatePrompt,
    useDeletePrompt, useBulkDeletePrompts, useLikePrompt, useCopyPrompt, useFavoritePrompt,
    useFavorites, useMostLiked,
} from "@/hooks/useApi";
import type { Prompt } from "@/types";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import UpgradeScreen from "@/components/UpgradeScreen";

const ITEMS_PER_PAGE = 24;

const HorizontalSection = ({
    title, icon: Icon, iconColor, prompts, onCardClick, onLike, onFavorite, onCopy, isAdmin, onEdit, onDelete,
}: {
    title: string; icon: any; iconColor: string; prompts: Prompt[];
    onCardClick: (p: Prompt) => void; onLike: (p: Prompt, e?: React.MouseEvent) => void;
    onFavorite: (p: Prompt, e?: React.MouseEvent) => void; onCopy: (p: Prompt, e?: React.MouseEvent) => void;
    isAdmin: boolean; onEdit: (p: Prompt) => void; onDelete: (p: Prompt) => void;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Drag-to-scroll state
    const isDragging = useRef(false);
    const hasDragged = useRef(false);
    const dragStartX = useRef(0);
    const scrollStartLeft = useRef(0);
    const [grabbing, setGrabbing] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };
    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener("scroll", checkScroll, { passive: true });
        return () => { if (el) el.removeEventListener("scroll", checkScroll); };
    }, [prompts]);
    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    };

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        isDragging.current = true;
        hasDragged.current = false;
        dragStartX.current = e.pageX;
        scrollStartLeft.current = el.scrollLeft;
        setGrabbing(true);
        el.style.scrollSnapType = "none";
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const el = scrollRef.current;
        if (!el) return;
        e.preventDefault();
        const dx = e.pageX - dragStartX.current;
        if (Math.abs(dx) > 5) hasDragged.current = true;
        el.scrollLeft = scrollStartLeft.current - dx;
    };
    const handleMouseUp = () => {
        isDragging.current = false;
        setGrabbing(false);
        const el = scrollRef.current;
        if (el) setTimeout(() => { el.style.scrollSnapType = ""; }, 50);
    };
    const handleMouseLeave = () => {
        if (isDragging.current) {
            isDragging.current = false;
            setGrabbing(false);
            const el = scrollRef.current;
            if (el) setTimeout(() => { el.style.scrollSnapType = ""; }, 50);
        }
    };
    const handleCardClick = (prompt: Prompt) => {
        if (hasDragged.current) return; // Don't open card if user was dragging
        onCardClick(prompt);
    };

    if (!prompts.length) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-2 group/hdr cursor-pointer hover:opacity-80 transition-opacity select-none"
                >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
                    <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
                    <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full">{prompts.length}</span>
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground group-hover/hdr:text-foreground transition-colors">
                        {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </div>
                </button>
                {!collapsed && (
                    <div className="flex items-center gap-1">
                        {canScrollLeft && (<button onClick={() => scroll("left")} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"><ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>)}
                        {canScrollRight && (<button onClick={() => scroll("right")} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"><ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>)}
                    </div>
                )}
            </div>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}
            >
                <div
                    ref={scrollRef}
                    className={`flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory select-none ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {prompts.map((prompt) => (
                        <div key={prompt.id} className="min-w-[150px] max-w-[170px] sm:min-w-[180px] sm:max-w-[200px] md:min-w-[190px] md:max-w-[210px] snap-start shrink-0 group relative" onClick={() => handleCardClick(prompt)}>
                            <div className={`rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${grabbing ? "pointer-events-none" : ""}`}>
                                {isAdmin && <CardAdminActions onEdit={() => onEdit(prompt)} onDelete={() => onDelete(prompt)} />}
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    <img src={prompt.thumbnail} alt={prompt.title} loading="lazy" draggable={false} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Badge className="absolute top-2 right-2 text-[10px]" variant={prompt.type === "video" ? "warning" : "default"}>
                                        {prompt.type === "video" ? <><Video className="h-2.5 w-2.5 mr-0.5" />VIDEO</> : <><Image className="h-2.5 w-2.5 mr-0.5" />IMG</>}
                                    </Badge>
                                </div>
                                <div className="p-2.5 sm:p-3">
                                    <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1 mb-0.5 sm:mb-1">{prompt.title}</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-1">{prompt.category}</p>
                                    <div className="flex items-center justify-between gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); if (!hasDragged.current) onCopy(prompt, e); }} className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-primary hover:text-primary/80 transition-colors"><Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Copiar</button>
                                        <div className="flex items-center gap-1 sm:gap-1.5">
                                            <button onClick={(e) => { e.stopPropagation(); if (!hasDragged.current) onFavorite(prompt, e); }} className="transition-colors"><Bookmark className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors ${prompt.favorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); if (!hasDragged.current) onLike(prompt, e); }} className="flex items-center gap-0.5 transition-colors"><Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors ${prompt.liked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"}`} /><span className="text-[10px] sm:text-xs text-muted-foreground">{prompt.likes}</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Prompts = () => {
    const { isAdmin } = useAuth();
    const { canAccessPrompts } = usePlanAccess();
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [expandedPrompt, setExpandedPrompt] = useState<Prompt | null>(null);
    const [copied, setCopied] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>();
    const [formOpen, setFormOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

    // Bulk selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 400);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [searchQuery]);
    useEffect(() => { setPage(1); }, [activeFilter, selectedCategory]);
    useEffect(() => { if (expandedPrompt) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [expandedPrompt]);
    useEffect(() => { if (!expandedPrompt) setCopied(false); }, [expandedPrompt]);
    useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setExpandedPrompt(null); if (selectionMode && selectedIds.size === 0) setSelectionMode(false); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [selectionMode, selectedIds]);

    const apiParams: Record<string, unknown> = { page, limit: ITEMS_PER_PAGE };
    if (activeFilter !== "all") apiParams.type = activeFilter.toUpperCase();
    if (selectedCategory) apiParams.category = selectedCategory;
    if (debouncedSearch) apiParams.search = debouncedSearch;

    const { data: promptsResponse, isLoading, isFetching } = usePromptsPaginated(apiParams);
    const { data: categories = [] } = useCategories();
    const { data: favorites = [] } = useFavorites();
    const { data: mostLiked = [] } = useMostLiked({ limit: 20 });
    const createPrompt = useCreatePrompt();
    const updatePrompt = useUpdatePrompt();
    const deletePrompt = useDeletePrompt();
    const bulkDelete = useBulkDeletePrompts();
    const likePrompt = useLikePrompt();
    const copyPrompt = useCopyPrompt();
    const favoritePrompt = useFavoritePrompt();

    const prompts = promptsResponse?.data || [];
    const meta = promptsResponse?.meta || { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 };
    const totalPages = meta.totalPages || 1;

    // Selection handlers
    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAll = () => {
        setSelectedIds(new Set(prompts.map((p: Prompt) => String(p.id))));
    };
    const deselectAll = () => {
        setSelectedIds(new Set());
    };
    const toggleSelectionMode = () => {
        if (selectionMode) { setSelectedIds(new Set()); }
        setSelectionMode(!selectionMode);
    };
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkDelete.mutateAsync(Array.from(selectedIds));
            toast.success(`${selectedIds.size} prompts excluídos com sucesso!`);
            setSelectedIds(new Set());
            setSelectionMode(false);
        } catch { toast.error("Erro ao excluir prompts em massa"); }
        setBulkDeleteDialogOpen(false);
    };

    const handleCopy = async (prompt: Prompt, e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigator.clipboard.writeText(prompt.promptText || (prompt as any).content || "");
        setCopied(true); setTimeout(() => setCopied(false), 2000);
        try { await copyPrompt.mutateAsync(String(prompt.id)); } catch { }
        toast.success(`Prompt "${prompt.title}" copiado!`);
    };
    const handleLike = async (prompt: Prompt, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const res = await likePrompt.mutateAsync(String(prompt.id));
            const liked = res?.data?.liked;
            if (liked) toast.success(`"${prompt.title}" curtido!`);
            else toast.success(`Curtida removida de "${prompt.title}"`);
        } catch { toast.error("Erro ao curtir prompt"); }
    };
    const handleFavorite = async (prompt: Prompt, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const res = await favoritePrompt.mutateAsync(String(prompt.id));
            const fav = res?.data?.favorited;
            if (fav) toast.success(`"${prompt.title}" adicionado aos favoritos!`);
            else toast.success(`"${prompt.title}" removido dos favoritos`);
        } catch { toast.error("Erro ao favoritar prompt"); }
    };
    const handleAddPrompt = () => { setEditingPrompt(null); setFormOpen(true); };
    const handleEditPrompt = (prompt: Prompt) => { setEditingPrompt(prompt); setFormOpen(true); };
    const handleDeleteClick = (prompt: Prompt) => { setPromptToDelete(prompt); setDeleteDialogOpen(true); };
    const handleDeleteConfirm = async () => {
        if (!promptToDelete) return;
        try { await deletePrompt.mutateAsync(String(promptToDelete.id)); toast.success(`"${promptToDelete.title}" foi excluido`); } catch { toast.error("Erro ao excluir prompt"); }
        setDeleteDialogOpen(false); setPromptToDelete(null);
    };
    const handleFormSubmit = async (promptData: Partial<Prompt> & { categoryId?: string }) => {
        try {
            const apiData: Record<string, unknown> = {
                title: promptData.title, content: promptData.promptText || (promptData as any).content,
                description: promptData.description, type: (promptData.type || "image").toUpperCase(),
                categoryId: promptData.categoryId, thumbnailUrl: promptData.thumbnail || (promptData as any).thumbnailUrl,
                mediaUrl: (promptData as any).mediaUrl || null, tags: promptData.tags || [],
            };
            if (promptData.id) { await updatePrompt.mutateAsync({ id: String(promptData.id), ...apiData } as any); toast.success(`"${promptData.title}" foi atualizado`); }
            else { await createPrompt.mutateAsync(apiData as any); toast.success(`"${promptData.title}" foi criado`); }
        } catch { toast.error("Erro ao salvar prompt"); }
    };

    // Improved pagination: show 1-9 ... last 5 pages
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 14) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const firstBlock = Math.min(9, totalPages);
            for (let i = 1; i <= firstBlock; i++) pages.push(i);
            const lastBlockStart = totalPages - 4;
            if (firstBlock < lastBlockStart - 1) {
                pages.push("...");
            }
            for (let i = Math.max(firstBlock + 1, lastBlockStart); i <= totalPages; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    const categoryOptions = categories.map((c: any) => ({ id: c.id || c, name: c.name || c })).filter((c: any) => c.name);

    useEffect(() => {
        if (!expandedPrompt) return;
        const updated = prompts.find((p: Prompt) => p.id === expandedPrompt.id)
            || (favorites as Prompt[]).find((p: Prompt) => p.id === expandedPrompt.id)
            || (mostLiked as Prompt[]).find((p: Prompt) => p.id === expandedPrompt.id);
        if (updated) setExpandedPrompt(updated);
    }, [prompts, favorites, mostLiked]);

    if (isLoading && !prompts.length) return (<div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);

    // Plan access guard
    if (!canAccessPrompts) return <UpgradeScreen feature="Prompts" />;

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 lg:mb-2">Biblioteca de Prompts</h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{meta.total > 0 ? `${meta.total.toLocaleString("pt-BR")} prompts disponíveis` : "Milhares de prompts prontos para usar"}</p>
            </div>

            {/* Collapsible horizontal sections */}
            <HorizontalSection title="Meus Favoritos" icon={Star} iconColor="text-yellow-400" prompts={favorites as Prompt[]} onCardClick={setExpandedPrompt} onLike={handleLike} onFavorite={handleFavorite} onCopy={handleCopy} isAdmin={isAdmin} onEdit={handleEditPrompt} onDelete={handleDeleteClick} />
            <HorizontalSection title="+ Curtidos" icon={TrendingUp} iconColor="text-red-400" prompts={mostLiked as Prompt[]} onCardClick={setExpandedPrompt} onLike={handleLike} onFavorite={handleFavorite} onCopy={handleCopy} isAdmin={isAdmin} onEdit={handleEditPrompt} onDelete={handleDeleteClick} />

            {((favorites as Prompt[]).length > 0 || (mostLiked as Prompt[]).length > 0) && (
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Todos os Prompts</span><div className="flex-1 h-px bg-border" /></div>
            )}

            {/* Filters & search bar */}
            <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:gap-4">
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1.5 sm:pb-0">
                    <FilterButtons filters={PROMPT_FILTERS} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                </div>
                <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center flex-wrap">
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-9 sm:h-10 rounded-xl border border-border bg-card px-3 sm:px-4 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-0 max-w-[180px] sm:max-w-none">
                        <option value="">Todas as Categorias</option>
                        {categoryOptions.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                    <InputWithIcon icon={Search} placeholder="Buscar prompts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-36 sm:w-48 lg:w-64" />
                    {isAdmin && (
                        <Button variant={selectionMode ? "default" : "outline"} size="sm" className="h-9 sm:h-10 gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap" onClick={toggleSelectionMode}>
                            {selectionMode ? <><XSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden xs:inline">Cancelar</span></> : <><CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="hidden xs:inline">Selecionar</span></>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Bulk selection toolbar */}
            {selectionMode && isAdmin && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">{selectedIds.size} {selectedIds.size === 1 ? "prompt selecionado" : "prompts selecionados"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={selectAll} className="h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3">Todos ({prompts.length})</Button>
                        {selectedIds.size > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={deselectAll} className="h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3">Desmarcar</Button>
                                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} className="h-8 sm:h-9 gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3">
                                    <Trash2 className="h-3.5 w-3.5" />Excluir {selectedIds.size}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Prompt grid */}
            <div className="relative">
                {isFetching && prompts.length > 0 && (<div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-xl"><Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /></div>)}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3">
                    {prompts.map((prompt: Prompt) => (
                        <GlassCard key={prompt.id} className={`p-0 overflow-hidden cursor-pointer group relative ${selectionMode && selectedIds.has(String(prompt.id)) ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`} hover onClick={() => selectionMode ? toggleSelect(String(prompt.id)) : setExpandedPrompt(prompt)}>
                            {selectionMode && isAdmin && (
                                <div className="absolute top-2 left-2 z-20" onClick={(e) => toggleSelect(String(prompt.id), e)}>
                                    <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.has(String(prompt.id)) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50 bg-background/80 backdrop-blur-sm hover:border-primary"}`}>
                                        {selectedIds.has(String(prompt.id)) && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
                                    </div>
                                </div>
                            )}
                            {isAdmin && !selectionMode && <CardAdminActions onEdit={() => handleEditPrompt(prompt)} onDelete={() => handleDeleteClick(prompt)} />}
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <img src={prompt.thumbnail} alt={prompt.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[9px] sm:text-[10px]" variant={prompt.type === "video" ? "warning" : "default"}>
                                    {prompt.type === "video" ? <><Video className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />VIDEO</> : <><Image className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />IMAGEM</>}
                                </Badge>
                                {!selectionMode && (
                                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="hidden sm:flex items-center gap-1 text-xs text-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full"><Sparkles className="h-3 w-3 text-primary" /> Expandir</div>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 sm:p-2.5">
                                <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-1">{prompt.title}</h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 line-clamp-1">{prompt.category}</p>
                                <div className="flex items-center justify-between gap-1">
                                    <Button variant="gradient" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2" onClick={(e) => handleCopy(prompt, e)}><Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /><span className="hidden xs:inline">Copiar</span><span className="xs:hidden">Copy</span></Button>
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0" onClick={(e) => handleFavorite(prompt, e)}><Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${prompt.favorited ? "fill-yellow-400 text-yellow-400" : ""}`} /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-1 sm:px-1.5 gap-0.5" onClick={(e) => handleLike(prompt, e)}><Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${prompt.liked ? "fill-red-500 text-red-500" : ""}`} /><span className="text-[10px] sm:text-xs">{prompt.likes}</span></Button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {prompts.length === 0 && !isFetching && (
                <div className="text-center py-10 sm:py-12 lg:py-16"><Sparkles className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" /><h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2">Nenhum prompt encontrado</h3><p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{searchQuery ? "Tente outra busca" : "Nenhum prompt disponível no momento"}</p></div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-2.5 sm:gap-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                        <Button variant="outline" size="sm" className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm" onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page <= 1}><ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /><span className="hidden sm:inline">Anterior</span></Button>
                        {getPageNumbers().map((p, i) => typeof p === "string" ? (<span key={`dots-${i}`} className="px-1 sm:px-2 text-muted-foreground select-none text-xs sm:text-sm">•••</span>) : (<Button key={p} variant={p === page ? "default" : "outline"} size="sm" className={`h-8 sm:h-10 min-w-[32px] sm:min-w-[40px] text-xs sm:text-sm ${p === page ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold" : ""}`} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{p}</Button>))}
                        <Button variant="outline" size="sm" className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm" onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page >= totalPages}><span className="hidden sm:inline">Próxima</span><ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" /></Button>
                    </div>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, meta.total)} de {meta.total.toLocaleString("pt-BR")} prompts — Página {page} de {totalPages}</p>
                </div>
            )}

            {isAdmin && !selectionMode && <FloatingActionButton onClick={handleAddPrompt} label="Novo Prompt" />}

            {/* Expanded prompt modal */}
            {expandedPrompt && createPortal(
                <div className="fixed inset-0 animate-fade-in" style={{ zIndex: 99999, isolation: "isolate" }} onClick={() => setExpandedPrompt(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-3 lg:p-4">
                        <div className="relative w-full sm:w-[96vw] sm:max-w-5xl bg-card rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95vh] sm:max-h-[88vh] lg:max-h-[90vh] flex flex-col shadow-2xl border-t sm:border border-border/50" style={{ animation: "slideUp 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setExpandedPrompt(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors text-white"><X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
                            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
                            <div className="overflow-y-auto flex-1 overscroll-contain">
                                <div className="sm:grid sm:grid-cols-[1fr,1.2fr]">
                                    <div className="relative bg-black sm:self-start sm:sticky sm:top-0">
                                        <div className="w-full overflow-hidden flex items-center justify-center bg-black">
                                            {expandedPrompt.type === "video" && expandedPrompt.mediaUrl ? (
                                                <video src={expandedPrompt.mediaUrl} poster={expandedPrompt.thumbnail} controls autoPlay loop playsInline className="w-full max-h-[40vh] sm:max-h-[88vh] sm:min-h-[400px] lg:min-h-[500px] object-contain" />
                                            ) : (
                                                <img src={expandedPrompt.thumbnail} alt={expandedPrompt.title} className="w-full max-h-[40vh] sm:max-h-[88vh] sm:min-h-[400px] lg:min-h-[500px] object-contain sm:object-cover" />
                                            )}
                                        </div>
                                        <Badge className="absolute top-3 left-3 sm:top-4 sm:left-4" variant={expandedPrompt.type === "video" ? "warning" : "default"}>
                                            {expandedPrompt.type === "video" ? <><Video className="h-3 w-3 mr-1" />VIDEO</> : <><Image className="h-3 w-3 mr-1" />IMAGEM</>}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col min-h-0">
                                        <div className="p-4 sm:p-5 lg:p-6 pb-2 sm:pb-3">
                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight pr-8 sm:pr-10">{expandedPrompt.title}</h2>
                                            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                                                {expandedPrompt.author && (<span className="flex items-center gap-1 sm:gap-1.5"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /><span className="truncate max-w-[100px] sm:max-w-[120px]">{expandedPrompt.author}</span></span>)}
                                                {expandedPrompt.category && (<span className="inline-flex px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-medium">{expandedPrompt.category}</span>)}
                                                <span className="flex items-center gap-1 sm:gap-1.5"><Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${expandedPrompt.liked ? "fill-red-500 text-red-500" : "text-red-400"}`} />{expandedPrompt.likes} curtidas</span>
                                                {expandedPrompt.favorited && (<span className="flex items-center gap-1 sm:gap-1.5"><Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />Favoritado</span>)}
                                            </div>
                                        </div>
                                        {expandedPrompt.description && (<div className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3"><p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{expandedPrompt.description}</p></div>)}
                                        {expandedPrompt.tags && expandedPrompt.tags.length > 0 && (<div className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3 flex flex-wrap gap-1 sm:gap-1.5">{expandedPrompt.tags.map((tag) => (<span key={tag} className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium">#{tag}</span>))}</div>)}
                                        <div className="px-4 sm:px-5 lg:px-6 pb-2 sm:pb-3 flex-1">
                                            <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2"><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" /><h3 className="text-xs sm:text-sm font-semibold text-foreground">Prompt Completo</h3></div>
                                            <div className="bg-muted/40 rounded-xl p-3 sm:p-4 border border-border/40 max-h-[30vh] sm:max-h-[35vh] lg:max-h-[45vh] overflow-y-auto"><pre className="whitespace-pre-wrap text-xs sm:text-sm text-foreground/90 font-mono leading-relaxed break-words">{expandedPrompt.promptText || (expandedPrompt as any).content || "Conteudo nao disponivel"}</pre></div>
                                        </div>
                                        <div className="sticky bottom-0 p-3 sm:p-4 lg:p-5 bg-card/95 backdrop-blur-sm border-t border-border/30 mt-auto shrink-0">
                                            <div className="flex gap-1.5 sm:gap-2 lg:gap-3">
                                                <Button variant="gradient" size="lg" className="flex-1 h-10 sm:h-11 lg:h-12 text-xs sm:text-sm lg:text-base font-semibold rounded-xl" onClick={() => handleCopy(expandedPrompt)}>
                                                    {copied ? <><Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />Copiado!</> : <><Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />Copiar Prompt</>}
                                                </Button>
                                                <Button variant="outline" size="lg" className={`h-10 sm:h-11 lg:h-12 px-3 sm:px-4 rounded-xl transition-colors ${expandedPrompt.favorited ? "border-yellow-400/50 text-yellow-400 hover:text-yellow-500" : ""}`} onClick={() => handleFavorite(expandedPrompt)}>
                                                    <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 sm:mr-1.5 lg:mr-2 ${expandedPrompt.favorited ? "fill-yellow-400 text-yellow-400" : ""}`} /><span className="hidden lg:inline">{expandedPrompt.favorited ? "Favoritado" : "Favoritar"}</span>
                                                </Button>
                                                <Button variant="outline" size="lg" className={`h-10 sm:h-11 lg:h-12 px-3 sm:px-4 rounded-xl transition-colors ${expandedPrompt.liked ? "border-red-400/50 text-red-400 hover:text-red-500" : ""}`} onClick={() => handleLike(expandedPrompt)}>
                                                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 sm:mr-1.5 lg:mr-2 ${expandedPrompt.liked ? "fill-red-500 text-red-500" : ""}`} /><span className="hidden lg:inline">{expandedPrompt.liked ? "Curtido" : "Curtir"}</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }
        @media (min-width: 640px) { @keyframes slideUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } }
      `}</style>

            <PromptFormDrawer open={formOpen} onOpenChange={setFormOpen} prompt={editingPrompt} onSubmit={handleFormSubmit} categories={categoryOptions} />

            {/* Single delete dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <div className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-center text-foreground text-base sm:text-lg">Excluir Prompt</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
                            Tem certeza que deseja excluir{" "}
                            {promptToDelete ? <><strong>"{promptToDelete.title}"</strong></> : "este item"}?
                            <br /><span className="text-[10px] sm:text-xs mt-1 block">Esta ação não pode ser desfeita.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center gap-2 sm:gap-3">
                        <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80 text-xs sm:text-sm h-9 sm:h-10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-white text-xs sm:text-sm h-9 sm:h-10">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <div className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-destructive/20 flex items-center justify-center">
                            <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-center text-foreground text-lg sm:text-xl">Excluir {selectedIds.size} Prompts</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
                            Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? "prompt" : "prompts"} selecionados?
                            <br /><span className="text-[10px] sm:text-xs mt-2 block text-destructive/80 font-medium">⚠️ Esta ação é irreversível e não pode ser desfeita!</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center gap-2 sm:gap-3">
                        <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80 text-xs sm:text-sm h-9 sm:h-10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10" disabled={bulkDelete.isPending}>
                            {bulkDelete.isPending ? <><Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />Excluindo...</> : <><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Excluir {selectedIds.size} Prompts</>}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Prompts;
