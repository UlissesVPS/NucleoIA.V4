import { motion } from "framer-motion";
import { Users, TrendingUp, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialProofProps {
  type: "members" | "trending" | "rating" | "recent";
  value: string | number;
  label?: string;
  className?: string;
  animate?: boolean;
}

const icons = {
  members: Users,
  trending: TrendingUp,
  rating: Star,
  recent: Clock,
};

const colors = {
  members: "text-primary bg-primary/10 border-primary/20",
  trending: "text-orange bg-orange/10 border-orange/20",
  rating: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  purple: "text-purple bg-purple/10 border-purple/20",
};

export function SocialProof({ 
  type, 
  value, 
  label, 
  className,
  animate = true 
}: SocialProofProps) {
  const Icon = icons[type];
  const colorClass = colors[type] || colors.members;
  
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border",
        colorClass,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-semibold">{value}</span>
      {label && <span className="text-muted-foreground text-sm">{label}</span>}
    </motion.div>
  );
}

interface LiveCounterProps {
  count: number;
  label: string;
  className?: string;
}

export function LiveCounter({ count, label, className }: LiveCounterProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {/* Live dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="font-semibold text-foreground">{count.toLocaleString()}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

interface AvatarStackProps {
  count: number;
  maxAvatars?: number;
  className?: string;
}

export function AvatarStack({ count, maxAvatars = 4, className }: AvatarStackProps) {
  const displayCount = Math.min(count, maxAvatars);
  const remainingCount = count - displayCount;
  
  // Generate placeholder avatars with gradients
  const avatars = Array.from({ length: displayCount }, (_, i) => ({
    id: i,
    gradient: [
      "from-primary to-orange",
      "from-purple to-pink",
      "from-orange to-pink",
      "from-pink to-purple",
    ][i % 4],
  }));

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {avatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className={cn(
              "w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br",
              avatar.gradient
            )}
            style={{ zIndex: displayCount - index }}
          >
            {String.fromCharCode(65 + index)}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

interface CountdownTimerProps {
  endTime: Date;
  label?: string;
  className?: string;
}

export function CountdownTimer({ endTime, label = "Oferta expira em:", className }: CountdownTimerProps) {
  const hours = 23;
  const minutes = 45;
  const seconds = 32;
  
  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 font-mono font-bold">
        <span className="bg-primary/20 text-primary px-2 py-1 rounded">{hours.toString().padStart(2, '0')}</span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-primary/20 text-primary px-2 py-1 rounded">{minutes.toString().padStart(2, '0')}</span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-primary/20 text-primary px-2 py-1 rounded animate-pulse">
          {seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
