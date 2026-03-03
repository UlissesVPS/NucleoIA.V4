import type { AIToolCategory } from "@/types";
import { Sparkles, FileText, Video, Image, Mic, Palette, Wand, Presentation, type LucideIcon } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export const AI_TOOL_FILTERS: FilterOption[] = [
  { id: "all", label: "Todas", icon: Sparkles },
  { id: "text", label: "Texto", icon: FileText },
  { id: "video", label: "Vídeo", icon: Video },
  { id: "image", label: "Imagem", icon: Image },
  { id: "voice", label: "Voz & Avatares", icon: Mic },
  { id: "design", label: "Design", icon: Palette },
  { id: "editing", label: "Edição", icon: Wand },
  { id: "presentations", label: "Apresentações", icon: Presentation },
];

export const PROMPT_FILTERS: FilterOption[] = [
  { id: "all", label: "Todos" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
];

export const PROMPT_CATEGORIES: string[] = [
  "Todas as Categorias",
  "Criativo",
  "Comercial",
  "Influencer",
  "Comedia",
  "Produto",
  "Bebe",
  "Animacao",
  "Entrevista",
  "Vlog",
  "Tutorial",
  "Marketing",
  "Negocios",
  "Educacao",
  "Tecnologia",
  "Saude",
  "Financas",
  "Outros",
];
