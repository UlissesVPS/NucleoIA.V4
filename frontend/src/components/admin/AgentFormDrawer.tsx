import { useState, useEffect } from "react";
import { Users } from "lucide-react";
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

interface AgentFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

const categories = [
  { value: "GERAL", label: "Geral" },
  { value: "INFLUENCER", label: "Influencer" },
  { value: "MARKETING", label: "Marketing" },
  { value: "CONTEUDO", label: "Conteudo" },
  { value: "VENDAS", label: "Vendas" },
  { value: "DESIGN", label: "Design" },
];

const AgentFormDrawer = ({ open, onOpenChange, agent, onSubmit }: AgentFormDrawerProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GERAL");
  const [imageUrl, setImageUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!agent;

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setCategory(agent.category);
      setImageUrl(agent.imageUrl || "");
      setExternalUrl(agent.externalUrl || "");
      setBadge(agent.badge || "");
      setOrder(agent.order);
      setIsActive(agent.isActive);
    } else {
      resetForm();
    }
  }, [agent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: agent?.id,
      name,
      description,
      category,
      imageUrl: imageUrl || null,
      externalUrl,
      badge: badge || null,
      order,
      isActive,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("GERAL");
    setImageUrl("");
    setExternalUrl("");
    setBadge("");
    setOrder(0);
    setIsActive(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nome do Agente</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Criador de Influencer IA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-description">Descricao</Label>
            <Textarea
              id="agent-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descricao do que o agente faz..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-url">URL do Agente (ChatGPT)</Label>
            <Input
              id="agent-url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://chatgpt.com/g/..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
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
            value={imageUrl}
            onChange={setImageUrl}
            label="Imagem do Agente"
          />

          <div className="space-y-2">
            <Label htmlFor="agent-badge">Badge (opcional)</Label>
            <Input
              id="agent-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Ex: NOVO, POPULAR"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-order">Ordem</Label>
            <Input
              id="agent-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="agent-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="agent-active" className="cursor-pointer">
              Ativo
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
              {isEditing ? "Salvar Alteracoes" : "Adicionar Agente"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AgentFormDrawer;
