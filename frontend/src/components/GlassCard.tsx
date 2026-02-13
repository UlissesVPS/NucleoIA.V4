import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className, gradient = false, hover = false, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6",
        gradient ? "glass-card-gradient" : "glass-card",
        hover && "transition-all duration-300 hover:scale-[1.02] hover:shadow-glow cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
