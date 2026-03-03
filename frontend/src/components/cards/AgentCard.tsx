import { useState, type CSSProperties } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { CardAdminActions } from "@/components/admin";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GLOW_COLORS = [
  { h: 270, s: 70, l: 55 },
  { h: 320, s: 80, l: 60 },
  { h: 24, s: 100, l: 55 },
  { h: 186, s: 85, l: 45 },
  { h: 142, s: 71, l: 45 },
  { h: 217, s: 91, l: 60 },
];

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

interface AgentCardProps {
  agent: Agent;
  index?: number;
  showAdminActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AgentCard = ({ agent, index = 0, showAdminActions = false, onEdit, onDelete }: AgentCardProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const color = GLOW_COLORS[index % GLOW_COLORS.length];
  const glowHsl = `${color.h} ${color.s}% ${color.l}%`;

  const handleAccess = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent.externalUrl) {
      window.open(agent.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.info("Link do agente ainda nao disponivel");
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent.externalUrl) {
      toast.info("Link do agente ainda nao disponivel");
      return;
    }
    try {
      await navigator.clipboard.writeText(agent.externalUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    GERAL: "Geral",
    INFLUENCER: "Influencer",
    MARKETING: "Marketing",
    CONTEUDO: "Conteudo",
    VENDAS: "Vendas",
    DESIGN: "Design",
  };

  return (
    <div className="group w-full h-full">
      <div
        className={`ia-card relative overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 ${expanded ? 'z-10' : ''}`}
        style={{ ["--glow" as string]: glowHsl } as CSSProperties}
        onClick={() => setExpanded(!expanded)}
      >
        {agent.badge && (
          <Badge variant="success" className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            {agent.badge}
          </Badge>
        )}

        {showAdminActions && onEdit && onDelete && (
          <CardAdminActions
            onEdit={onEdit}
            onDelete={onDelete}
            className="top-2 sm:top-3 left-2 sm:left-3 z-20"
          />
        )}

        <div className="p-1.5 sm:p-2 flex-1 flex flex-col">
          <div className="p-1.5 sm:p-2">
            <div className="aspect-square relative overflow-hidden rounded-lg sm:rounded-xl bg-muted/20">
              {agent.imageUrl ? (
                <img
                  src={agent.imageUrl}
                  alt={agent.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  style={{ borderRadius: "inherit", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <span className="text-3xl sm:text-4xl font-bold text-primary/60">{agent.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1.5 sm:pt-2 px-0.5 sm:px-1 pb-0.5 sm:pb-1 flex-1 flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 sm:mb-1 line-clamp-1">{agent.name}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 mb-1">
              {CATEGORY_LABELS[agent.category] || agent.category}
            </p>
            <p className={`text-[10px] sm:text-sm text-muted-foreground leading-relaxed flex-1 transition-all duration-300 ${expanded ? "" : "line-clamp-2"}`}>{agent.description}</p>
          </div>

          {/* Action buttons */}
          <div className="px-1.5 sm:px-2 pb-2 sm:pb-3 flex gap-2">
            <Button
              size="sm"
              variant="gradient"
              className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
              onClick={handleAccess}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Acessar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
