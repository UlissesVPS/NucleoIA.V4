import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, ArrowUpRight, Play, Sparkles } from "lucide-react";
import { AIListIcon, PromptHubIcon } from "@/components/DashboardIcons";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import HeroBanner from "@/components/HeroBanner";
import VIPProductsCarousel from "@/components/products/VIPProductsCarousel";
import { useAITools, usePrompts, useCourses } from "@/hooks/useApi";
import { useTranslation } from "@/lib/i18n";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: aiTools } = useAITools();
  const { data: prompts } = usePrompts();
  const { data: courses } = useCourses();

  const toolsCount = aiTools?.length ?? 0;
  const promptsCount = prompts?.length ?? 0;
  const coursesCount = courses?.length ?? 0;

  // Course progress data
  const coursesInProgress = (courses || []).filter((c) => c.progress > 0 && c.progress < 100);
  const featuredCourse = coursesInProgress[0] || (courses || [])[0];
  const secondaryCourses = (courses || []).filter((c) => c.id !== featuredCourse?.id).slice(0, 3);

  const quickAccessItems = [
    {
      customIcon: "ailist" as const,
      title: t("dashboard.aiListTitle"),
      count: toolsCount,
      description: t("common.tools"),
      href: "/ias",
      gradient: "from-orange-500 to-rose-500",
      hoverBorder: "hover:border-orange-500/40",
      hoverShadow: "hover:shadow-orange-500/10",
      countSuffix: "",
    },
    {
      customIcon: "prompthub" as const,
      title: t("dashboard.promptHub"),
      count: promptsCount,
      description: "prompts prontos",
      href: "/prompts",
      gradient: "from-purple-500 to-violet-600",
      hoverBorder: "hover:border-violet-500/40",
      hoverShadow: "hover:shadow-violet-500/10",
      countSuffix: "+",
    },
    {
      customIcon: "aulas" as const,
      icon: GraduationCap,
      title: t("dashboard.lessonsTitle"),
      count: coursesCount,
      description: "cursos premium",
      href: "/aulas",
      gradient: "from-blue-500 to-cyan-500",
      hoverBorder: "hover:border-blue-500/40",
      hoverShadow: "hover:shadow-blue-500/10",
      countSuffix: "",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero Section */}
      <HeroBanner />

      {/* Quick Access - Redesigned */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t("dashboard.quickAccess")}</h2>
          <Link to="/ias" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t("common.seeMore")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {quickAccessItems.map((item) => (
            <Link key={item.title} to={item.href}>
              <div className={`group relative rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm border border-border ${item.hoverBorder} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.hoverShadow} h-full`}>
                {/* Gradient accent bar */}
                <div className={`h-[3px] bg-gradient-to-r ${item.gradient}`} />

                {/* Subtle dot pattern */}
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="p-4 sm:p-5 relative">
                  {/* Header: icon + arrow */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    {item.customIcon === "ailist" ? (
                      <AIListIcon size="md" />
                    ) : item.customIcon === "prompthub" ? (
                      <PromptHubIcon size="md" />
                    ) : (
                      <div className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg shadow-blue-500/25 relative`}>
                        <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
                        {item.icon && <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white relative z-10" />}
                      </div>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                  </div>

                  {/* Count highlight */}
                  <div className="mb-1">
                    <span className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      {item.count}{item.countSuffix}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5">{item.title}</h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Continue Aprendendo */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Continue Aprendendo
          </h2>
          {coursesCount > 0 && (
            <Link to="/aulas" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {coursesCount === 0 ? (
          /* Empty state - compact horizontal banner */
          <div
            className="flex items-center justify-between p-4 sm:p-6 rounded-xl glass-card-gradient border border-border hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => navigate("/aulas")}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm sm:text-base">Comece sua jornada</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">Explore nossos cursos exclusivos</p>
              </div>
            </div>
            <Button variant="gradient" size="sm" className="flex-shrink-0">
              Explorar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Featured course - compact horizontal card */}
            {featuredCourse && (
              <div
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl glass-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/aulas/${featuredCourse.id}`)}
              >
                {/* Thumbnail small */}
                <div className="relative w-28 h-[72px] sm:w-32 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={featuredCourse.thumbnail}
                    alt={featuredCourse.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-7 h-7 text-white" fill="currentColor" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-semibold text-sm sm:text-base truncate mb-1.5">
                    {featuredCourse.title}
                  </h3>
                  {featuredCourse.progress > 0 && (
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${featuredCourse.progress}%` }}
                        />
                      </div>
                      <span className="text-primary text-xs sm:text-sm font-medium">
                        {featuredCourse.progress}%
                      </span>
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {featuredCourse.totalLessons} aulas
                  </p>
                </div>

                {/* Button */}
                <button
                  className="px-3 sm:px-4 py-2 rounded-full bg-primary text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/aulas/${featuredCourse.id}?autoplay=true`);
                  }}
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                  <span className="hidden xs:inline">
                    {featuredCourse.progress > 0 ? "Continuar" : "Assistir"}
                  </span>
                </button>
              </div>
            )}

            {/* Secondary courses - mini horizontal cards */}
            {secondaryCourses.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {secondaryCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg glass-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer flex-shrink-0 w-56 sm:w-64"
                    onClick={() => navigate(`/aulas/${course.id}`)}
                  >
                    <div className="w-14 h-9 sm:w-16 sm:h-10 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs sm:text-sm font-medium truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-14 sm:w-16 h-1 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-[10px] sm:text-xs">
                          {course.progress > 0 ? `${course.progress}%` : "Novo"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* VIP Products Carousel */}
      <VIPProductsCarousel />
    </div>
  );
};

export default Dashboard;
