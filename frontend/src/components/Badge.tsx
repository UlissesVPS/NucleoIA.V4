import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "count";
  className?: string;
}

const variantStyles = {
  default: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  count: "bg-primary/15 text-primary text-[0.65rem] px-1.5 py-0.5",
};

const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
