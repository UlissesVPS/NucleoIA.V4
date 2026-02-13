import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardAdminActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  show?: boolean;
}

const CardAdminActions = ({ onEdit, onDelete, className, show = true }: CardAdminActionsProps) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute top-2 right-2 flex gap-1 z-10",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        className="h-8 w-8 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors"
        title="Editar"
      >
        <Pencil className="h-4 w-4 text-foreground" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="h-8 w-8 rounded-lg bg-destructive/90 backdrop-blur-sm border border-destructive/50 flex items-center justify-center hover:bg-destructive transition-colors"
        title="Excluir"
      >
        <Trash2 className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};

export default CardAdminActions;
