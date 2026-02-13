import { motion } from "framer-motion";

interface IconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12", icon: 16, smIcon: 14 },
  md: { container: "w-10 h-10 sm:w-12 sm:h-12", icon: 20, smIcon: 16 },
  lg: { container: "w-12 h-12 sm:w-14 sm:h-14", icon: 24, smIcon: 20 },
};

// Cursos Icon - Stacked books with a star/bookmark
export const CursosIcon = ({ size = "sm", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div className={`${s.container} relative inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/25 ${className || ""}`}>
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10">
        {/* Bottom book */}
        <rect x="3" y="14" width="14" height="3" rx="0.8" fill="rgba(255,255,255,0.5)" transform="rotate(-5 3 14)" />
        {/* Middle book */}
        <rect x="4" y="10.5" width="14" height="3" rx="0.8" fill="rgba(255,255,255,0.7)" transform="rotate(2 4 10.5)" />
        {/* Top book (open) */}
        <path d="M5 5.5C5 5.5 8 4 11.5 4.5C15 5 18 6 18 6V12C18 12 15 11 11.5 10.5C8 10 5 11 5 11V5.5Z" fill="white" opacity="0.95" />
        <path d="M11.5 4.5V10.5" stroke="rgba(139,92,246,0.5)" strokeWidth="0.5" />
        {/* Star badge */}
        <circle cx="19" cy="5" r="3.5" fill="#fbbf24" />
        <path d="M19 3L19.7 4.4L21.2 4.6L20.1 5.7L20.4 7.2L19 6.5L17.6 7.2L17.9 5.7L16.8 4.6L18.3 4.4L19 3Z" fill="white" />
      </svg>
    </div>
  );
};

// Prompts Icon - Magic scroll with sparkles
export const PromptsIcon = ({ size = "sm", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div className={`${s.container} relative inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/25 ${className || ""}`}>
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10">
        {/* Scroll body */}
        <path d="M7 3C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3H7Z" fill="white" opacity="0.95" />
        {/* Fold corner */}
        <path d="M14 3V7C14 7.55 14.45 8 15 8H19" fill="rgba(251,146,60,0.3)" stroke="rgba(251,146,60,0.5)" strokeWidth="0.5" />
        {/* Text lines */}
        <rect x="8" y="11" width="8" height="1" rx="0.5" fill="rgba(234,88,12,0.4)" />
        <rect x="8" y="13.5" width="6" height="1" rx="0.5" fill="rgba(234,88,12,0.3)" />
        <rect x="8" y="16" width="7" height="1" rx="0.5" fill="rgba(234,88,12,0.25)" />
        {/* Sparkle top-right */}
        <motion.g
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M20 2L20.6 3.4L22 4L20.6 4.6L20 6L19.4 4.6L18 4L19.4 3.4L20 2Z" fill="white" />
        </motion.g>
        {/* Small sparkle */}
        <motion.g
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <path d="M3 8L3.4 9L4.4 9.4L3.4 9.8L3 10.8L2.6 9.8L1.6 9.4L2.6 9L3 8Z" fill="white" opacity="0.8" />
        </motion.g>
        {/* Magic wand line */}
        <path d="M9 8L7.5 9.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <circle cx="7" cy="10" r="0.8" fill="white" opacity="0.5" />
      </svg>
    </div>
  );
};

// Lista de IAs Icon - Robot face with neural network
export const AIListIcon = ({ size = "md", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div className={`${s.container} relative inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-red-500/25 ${className || ""}`}>
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6 relative z-10">
        {/* Neural dots background */}
        <circle cx="4" cy="6" r="1" fill="white" opacity="0.3" />
        <circle cx="20" cy="6" r="1" fill="white" opacity="0.3" />
        <circle cx="4" cy="18" r="1" fill="white" opacity="0.3" />
        <circle cx="20" cy="18" r="1" fill="white" opacity="0.3" />
        <line x1="4" y1="6" x2="8" y2="9" stroke="white" strokeWidth="0.5" opacity="0.2" />
        <line x1="20" y1="6" x2="16" y2="9" stroke="white" strokeWidth="0.5" opacity="0.2" />
        <line x1="4" y1="18" x2="8" y2="15" stroke="white" strokeWidth="0.5" opacity="0.2" />
        <line x1="20" y1="18" x2="16" y2="15" stroke="white" strokeWidth="0.5" opacity="0.2" />
        {/* Robot head */}
        <rect x="6.5" y="7" width="11" height="10" rx="2.5" fill="white" opacity="0.95" />
        {/* Antenna */}
        <line x1="12" y1="7" x2="12" y2="4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <motion.circle
          cx="12" cy="3.5"
          r="1.5"
          fill="#fbbf24"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Eyes */}
        <motion.circle
          cx="9.5" cy="11.5"
          r="1.5"
          fill="rgba(239,68,68,0.7)"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="14.5" cy="11.5"
          r="1.5"
          fill="rgba(239,68,68,0.7)"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        {/* Mouth - friendly smile */}
        <path d="M10 14.5C10 14.5 11 15.5 12 15.5C13 15.5 14 14.5 14 14.5" stroke="rgba(239,68,68,0.5)" strokeWidth="1" strokeLinecap="round" fill="none" />
        {/* Ears */}
        <rect x="4.5" y="10" width="2" height="4" rx="1" fill="white" opacity="0.7" />
        <rect x="17.5" y="10" width="2" height="4" rx="1" fill="white" opacity="0.7" />
      </svg>
    </div>
  );
};

// Prompt Hub Icon - Command terminal with lightning
export const PromptHubIcon = ({ size = "md", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div className={`${s.container} relative inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 shadow-lg shadow-violet-500/25 ${className || ""}`}>
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6 relative z-10">
        {/* Terminal window */}
        <rect x="3" y="4" width="18" height="16" rx="2.5" fill="white" opacity="0.95" />
        {/* Title bar */}
        <rect x="3" y="4" width="18" height="4" rx="2.5" fill="rgba(139,92,246,0.15)" />
        <rect x="3" y="6" width="18" height="2" fill="rgba(139,92,246,0.15)" />
        {/* Window dots */}
        <circle cx="6" cy="6" r="0.8" fill="rgba(239,68,68,0.6)" />
        <circle cx="8.5" cy="6" r="0.8" fill="rgba(234,179,8,0.6)" />
        <circle cx="11" cy="6" r="0.8" fill="rgba(34,197,94,0.6)" />
        {/* Prompt cursor */}
        <path d="M6 12L8.5 14L6 16" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="10.5" y="13" width="5" height="1.5" rx="0.5" fill="rgba(139,92,246,0.4)" />
        {/* Lightning bolt overlay */}
        <motion.g
          animate={{ opacity: [0.8, 1, 0.8], y: [0, -0.5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M17 1L14 6H17L14.5 10.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M17 1L14 6H17L14.5 10.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
        </motion.g>
      </svg>
    </div>
  );
};
