import { useState, useEffect, useRef } from "react";
import { Sparkles, Upload, Video, X, Loader2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageUpload } from "@/components/admin";
import { useUploadVideo } from "@/hooks/useApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Prompt, PromptType } from "@/types";

interface CategoryOption {
  id: string;
  name: string;
}

interface PromptFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
  onSubmit: (prompt: Partial<Prompt> & { categoryId?: string; mediaUrl?: string | null }) => void;
  categories?: CategoryOption[];
}

const PromptFormDrawer = ({ open, onOpenChange, prompt, onSubmit, categories = [] }: PromptFormDrawerProps) => {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PromptType>("image");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = useUploadVideo();
  const isEditing = !!prompt;

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setPromptText(prompt.promptText || (prompt as any).content || "");
      setDescription(prompt.description || "");
      setType(prompt.type);
      const matchedCat = categories.find(
        (c) => c.id === (prompt as any).categoryId || c.name === prompt.category
      );
      setCategoryId(matchedCat?.id || (prompt as any).categoryId || "");
      setThumbnail(prompt.thumbnail || "");
      setMediaUrl(prompt.mediaUrl || "");
      setIsPublic((prompt as any).isCommunity || false);
      setTagsInput(prompt.tags?.join(", ") || "");
    } else {
      resetForm();
    }
  }, [prompt, open, categories]);

  // Set default category when categories load
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleVideoUpload = async (file: File) => {
    if (file.size > 3 * 1024 * 1024 * 1024) {
      toast.error("Video deve ter no maximo 3GB");
      return;
    }
    const allowed = /\.(mp4|webm|mov|avi|mkv)$/i;
    if (!allowed.test(file.name)) {
      toast.error("Formato nao suportado. Use MP4, WebM, MOV, AVI ou MKV");
      return;
    }

    setVideoUploading(true);
    setVideoProgress("Enviando video...");
    try {
      const result = await uploadVideo.mutateAsync(file);
      setMediaUrl(result.url);
      toast.success("Video enviado com sucesso!");
    } catch {
      toast.error("Erro ao enviar video. Tente novamente.");
    } finally {
      setVideoUploading(false);
      setVideoProgress("");
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVideoUpload(file);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleVideoUpload(file);
  };

  const handleRemoveVideo = () => {
    setMediaUrl("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }
    if (type === "video" && !mediaUrl) {
      toast.error("Envie um video ou cole a URL do video");
      return;
    }
    onSubmit({
      id: prompt?.id,
      title,
      promptText,
      description,
      type,
      categoryId,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      mediaUrl: type === "video" ? mediaUrl : null,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      isPublic,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setPromptText("");
    setDescription("");
    setType("image");
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setThumbnail("");
    setMediaUrl("");
    setTagsInput("");
    setVideoUploading(false);
    setVideoProgress("");
    setIsPublic(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Prompt" : "Novo Prompt"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto em ambiente luxury"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptText">Conteudo do Prompt</Label>
            <Textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Digite o prompt completo aqui..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descricao do que o prompt faz..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PromptType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thumbnail - always shown */}
          <ImageUpload
            value={thumbnail}
            onChange={setThumbnail}
            label="Thumbnail / Imagem de Capa"
          />

          {/* Video upload - only when type is video */}
          {type === "video" && (
            <div className="space-y-2">
              <Label>Video do Prompt</Label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                onChange={handleVideoFileChange}
                className="hidden"
              />

              {mediaUrl ? (
                <div className="relative group rounded-xl border border-border overflow-hidden">
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-40 object-contain bg-black"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-destructive/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : videoUploading ? (
                <div className="h-40 rounded-xl border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-primary font-medium">{videoProgress}</p>
                </div>
              ) : (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleVideoDrop}
                  className="h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Arraste um video ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, WebM, MOV (max. 3GB)
                    </p>
                  </div>
                </div>
              )}

              {/* Or paste URL */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou cole a URL</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://... ou /uploads/videos/..."
                className="text-sm"
              />
            </div>
          )}

          {/* Toggle Publico */}
          <div className="space-y-2">
            <Label>Visibilidade</Label>
            <div
              onClick={() => setIsPublic(!isPublic)}
              className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isPublic ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                  {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{isPublic ? 'Publico na Comunidade' : 'Apenas para voce'}</p>
                  <p className="text-xs text-muted-foreground">{isPublic ? 'Outros membros podem ver e usar seu prompt' : 'Somente voce tem acesso'}</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isPublic ? 'bg-green-500' : 'bg-muted'}`}>
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por virgula)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: luxury, produto, fotografia"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={videoUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={videoUploading}
            >
              {videoUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : isEditing ? (
                "Salvar Alteracoes"
              ) : (
                "Publicar Prompt"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PromptFormDrawer;
