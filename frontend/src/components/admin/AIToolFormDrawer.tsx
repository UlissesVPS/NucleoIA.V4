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
import type { AITool, AIToolCategory } from "@/types";

interface AIToolFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: AITool | null;
  onSubmit: (tool: Omit<AITool, "id"> & { id?: string }) => void;
}

const categories: { value: AIToolCategory; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo" },
  { value: "voice", label: "Voz" },
  { value: "design", label: "Design" },
  { value: "editing", label: "Edição" },
  { value: "presentations", label: "Apresentações" },
];

const AIToolFormDrawer = ({ open, onOpenChange, tool, onSubmit }: AIToolFormDrawerProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AIToolCategory>("text");
  const [image, setImage] = useState("");
  const [unlimited, setUnlimited] = useState(true);

  const isEditing = !!tool;

  // Reset form when tool changes
  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setDescription(tool.description);
      setCategory(tool.category);
      setImage(tool.image);
      setUnlimited(tool.unlimited);
    } else {
      setName("");
      setDescription("");
      setCategory("text");
      setImage("");
      setUnlimited(true);
    }
  }, [tool, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: tool?.id,
      name,
      description,
      category,
      image,
      unlimited,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("text");
    setImage("");
    setUnlimited(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEditing ? "Editar IA" : "Nova IA"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da IA</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: ChatGPT 5 PRO"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da ferramenta..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AIToolCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ImageUpload
            value={image}
            onChange={setImage}
            label="Logo da IA"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="unlimited"
              checked={unlimited}
              onChange={(e) => setUnlimited(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="unlimited" className="cursor-pointer">
              Acesso ilimitado
            </Label>
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
              {isEditing ? "Salvar Alterações" : "Adicionar IA"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AIToolFormDrawer;
