import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-xl" },
  lg: { icon: 36, text: "text-2xl" },
  xl: { icon: 48, text: "text-4xl" },
};

const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Brain className="text-primary" size={icon} />
        <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
      </div>
      {showText && (
        <span className={cn("font-bold text-gradient", text)}>
          NÚCLEO IA
        </span>
      )}
    </div>
  );
};

export default Logo;
