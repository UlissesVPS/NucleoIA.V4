import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, Zap } from "lucide-react";
import { CursosIcon, PromptsIcon } from "@/components/DashboardIcons";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg-new.jpg";
import { LiveCounter, AvatarStack } from "@/components/ui/SocialProof";
import { FloatingAILogos3D } from "@/components/FloatingAILogos3D";
import { usePublicStats, useSystemStats } from "@/hooks/useApi";

import TutorialChecklistModal from "@/components/TutorialChecklistModal";

export function HeroBanner() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Fetch real counts from API (public stats for accurate totals)
  const { data: publicStats } = usePublicStats();
  const { data: stats } = useSystemStats();

  const toolsCount = publicStats?.totalTools ?? 0;
  const coursesCount = publicStats?.totalCourses ?? 0;
  const promptsCount = publicStats?.totalPrompts ?? 0;
  const membersCount = publicStats?.totalMembers ?? stats?.users?.total ?? 0;
  const onlineCount = stats?.activity?.online ?? 0;
  return (
    <section className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] xl:min-h-[700px] flex items-center overflow-hidden rounded-2xl sm:rounded-3xl">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Hero background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </div>

      {/* 3D Floating AI Logos Effect */}
      <FloatingAILogos3D />

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-[5]" />

      {/* Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Social Proof - Mobile optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
          >
            <AvatarStack count={membersCount} maxAvatars={4} />
            <div className="flex items-center gap-2">
              {onlineCount > 0 && <LiveCounter count={onlineCount} label="online agora" />}
            </div>
          </motion.div>

          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-white font-semibold">Bem-vindo à</span>
            <span className="text-gradient font-bold">NÚCLEO IA</span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
          >
            Seu Hub de{" "}
            <span className="relative inline-block">
              <span className="text-gradient">Inteligência Artificial</span>
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 sm:-top-2 -right-3 sm:-right-4 hidden xs:inline"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
              </motion.span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed"
          >
            Ferramentas de IA, cursos exclusivos e prompts prontos para monetização, criação de conteúdo e TikTok Shop.
          </motion.p>

          {/* CTA Buttons - Stack on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col xs:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <Link to="/aulas/00c1c024-cba9-43bb-9dac-dac6b6eda57d" className="w-full xs:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-gradient flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg touch-target"
              >
                Começar Agora
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTutorial(true)}
              className="w-full xs:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border border-border bg-card/50 hover:bg-card transition-colors touch-target"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              Ver Tutorial
            </motion.button>
          </motion.div>

          {/* Tutorial Modal */}
          <TutorialChecklistModal open={showTutorial} onOpenChange={setShowTutorial} />

          {/* Stats Grid - Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          >
            {[
              { value: toolsCount, label: "Ferramentas", lucideIcon: Zap, gradient: "from-orange-400 to-orange-600" },
              { value: coursesCount, label: "Cursos", customIcon: "cursos" },
              { value: promptsCount, label: "Prompts", customIcon: "prompts" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center sm:text-left"
              >
                {stat.customIcon === "cursos" ? (
                  <CursosIcon size="sm" className="mb-1.5 sm:mb-2" />
                ) : stat.customIcon === "prompts" ? (
                  <PromptsIcon size="sm" className="mb-1.5 sm:mb-2" />
                ) : (
                  <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl shadow-lg shadow-orange-500/40 mb-1.5 sm:mb-2 relative" style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}>
                    <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
                    {stat.lucideIcon && <stat.lucideIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white relative z-10" />}
                  </div>
                )}
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Glow Effects - Hidden on mobile for performance */}
      <div className="absolute bottom-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-[80px] sm:blur-[128px] pointer-events-none hidden sm:block" />
      <div className="absolute top-1/4 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none hidden sm:block" />
    </section>
  );
}

export default HeroBanner;
