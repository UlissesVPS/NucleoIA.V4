interface IconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12", iconClass: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" },
  md: { container: "w-10 h-10 sm:w-12 sm:h-12", iconClass: "w-5 h-5 sm:w-6 sm:h-6" },
  lg: { container: "w-12 h-12 sm:w-14 sm:h-14", iconClass: "w-6 h-6 sm:w-7 sm:h-7" },
};

// Cursos - Chapeu de formatura (gradiente violeta/roxo)
export const CursosIcon = ({ size = "sm", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.container} relative inline-flex items-center justify-center rounded-xl shadow-lg shadow-purple-500/40 ${className || ""}`}
      style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
    >
      <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${s.iconClass} relative z-10`}>
        <path d="M22 10l-10-5L2 10l10 5 10-5z" fill="white" stroke="none" />
        <path d="M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5" />
        <path d="M22 10v6" />
      </svg>
    </div>
  );
};

// Prompts - Estrela/varinha magica (gradiente amber/laranja/rosa)
export const PromptsIcon = ({ size = "sm", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.container} relative inline-flex items-center justify-center rounded-xl shadow-lg shadow-pink-500/40 ${className || ""}`}
      style={{ background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)" }}
    >
      <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${s.iconClass} relative z-10`}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="white" stroke="none" />
      </svg>
    </div>
  );
};

// Lista de IAs - Cerebro (gradiente laranja/vermelho)
export const AIListIcon = ({ size = "md", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.container} relative inline-flex items-center justify-center rounded-xl shadow-lg shadow-orange-500/40 ${className || ""}`}
      style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}
    >
      <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${s.iconClass} relative z-10`}>
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" fill="white" stroke="none" />
        <path d="M9 21h6" />
        <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
        <path d="M12 2V1" />
        <path d="M4.22 4.22l-.71-.71" />
        <path d="M19.78 4.22l.71-.71" />
      </svg>
    </div>
  );
};

// Prompt Hub - Terminal/codigo (gradiente roxo/violeta/indigo)
export const PromptHubIcon = ({ size = "md", className }: IconProps) => {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.container} relative inline-flex items-center justify-center rounded-xl shadow-lg shadow-fuchsia-500/40 ${className || ""}`}
      style={{ background: "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)" }}
    >
      <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${s.iconClass} relative z-10`}>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    </div>
  );
};
