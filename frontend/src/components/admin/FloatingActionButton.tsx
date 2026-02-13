import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

const FloatingActionButton = ({ onClick, label = "Novo", className }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 gap-2 rounded-full shadow-lg",
        "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
        "transform transition-all duration-200 hover:scale-105",
        "shadow-[0_8px_30px_rgb(0,0,0,0.3),0_0_20px_rgba(var(--primary),0.3)]",
        className
      )}
    >
      <Plus className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Button>
  );
};

export default FloatingActionButton;
