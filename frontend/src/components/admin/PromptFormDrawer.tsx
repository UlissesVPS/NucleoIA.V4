import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
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
import { PROMPT_CATEGORIES } from "@/constants/filters";
import type { Prompt, PromptType } from "@/types";

interface PromptFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
  onSubmit: (prompt: Partial<Prompt>) => void;
}

const PromptFormDrawer = ({ open, onOpenChange, prompt, onSubmit }: PromptFormDrawerProps) => {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PromptType>("image");
  const [category, setCategory] = useState("E-commerce");
  const [thumbnail, setThumbnail] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const isEditing = !!prompt;

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setPromptText(prompt.promptText);
      setDescription(prompt.description);
      setType(prompt.type);
      setCategory(prompt.category);
      setThumbnail(prompt.thumbnail || "");
      setTagsInput(prompt.tags?.join(", ") || "");
    } else {
      setTitle("");
      setPromptText("");
      setDescription("");
      setType("image");
      setCategory("E-commerce");
      setThumbnail("");
      setTagsInput("");
    }
  }, [prompt, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: prompt?.id,
      title,
      promptText,
      description,
      type,
      category,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setPromptText("");
    setDescription("");
    setType("image");
    setCategory("E-commerce");
    setThumbnail("");
    setTagsInput("");
  };

  // Filter out "Todas as Categorias" for the form
  const categoryOptions = PROMPT_CATEGORIES.filter((c) => c !== "Todas as Categorias");

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
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto em ambiente luxury"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptText">Conteúdo do Prompt</Label>
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do que o prompt faz..."
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
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ImageUpload
            value={thumbnail}
            onChange={setThumbnail}
            label="Imagem de Referência / Thumbnail"
          />

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
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
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              {isEditing ? "Salvar Alterações" : "Publicar Prompt"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PromptFormDrawer;
