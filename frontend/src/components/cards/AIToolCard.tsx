import type { CSSProperties } from "react";
import type { AITool } from "@/types";
import Badge from "@/components/Badge";
import { CardAdminActions } from "@/components/admin";

// Glow colors for variety (HSL triplets)
const GLOW_COLORS = [
  { h: 24, s: 100, l: 55 },  // Orange
  { h: 270, s: 70, l: 55 },  // Purple
  { h: 186, s: 85, l: 45 },  // Cyan
  { h: 142, s: 71, l: 45 },  // Green
  { h: 320, s: 80, l: 60 },  // Pink
  { h: 217, s: 91, l: 60 },  // Blue
];

interface AIToolCardProps {
  tool: AITool;
  index?: number;
  showAdminActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const AIToolCard = ({ tool, index = 0, showAdminActions = false, onEdit, onDelete, onClick }: AIToolCardProps) => {
  const color = GLOW_COLORS[index % GLOW_COLORS.length];

  // HSL triplets (no hsl() wrapper) for CSS var usage: hsl(var(--glow) / alpha)
  const glowHsl = `${color.h} ${color.s}% ${color.l}%`;

  const handleCardClick = () => {
    if (!showAdminActions && onClick) {
      onClick();
    }
  };

  return (
    <div className="group w-full h-full">
      <div 
        className={`ia-card relative overflow-hidden h-full flex flex-col ${!showAdminActions ? 'cursor-pointer' : ''}`} 
        style={{ ["--glow" as any]: glowHsl } as CSSProperties}
        onClick={handleCardClick}
      >
        {tool.unlimited && (
          <Badge variant="success" className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            ILIMITADO
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
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                style={{
                  borderRadius: "inherit",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
              />
            </div>
          </div>

          <div className="pt-1.5 sm:pt-2 px-0.5 sm:px-1 pb-0.5 sm:pb-1 flex-1 flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 sm:mb-1 line-clamp-1">{tool.name}</h3>
            <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{tool.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolCard;
