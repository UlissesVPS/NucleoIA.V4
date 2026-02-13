import { Link } from "react-router-dom";
import { 
  Sparkles, 
  PlayCircle, 
  CheckCircle2, 
  ArrowRight, 
  Bot, 
  FileText, 
  GraduationCap,
  Shield,
  Crown,
  Rocket,
  Target,
  Lightbulb
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const steps = [
  {
    id: 1,
    title: "Conheça a Plataforma",
    description: "Faça um tour completo pela NÚCLEO IA e descubra todas as funcionalidades disponíveis.",
    icon: Rocket,
    duration: "5 min",
    completed: false,
    href: "/dashboard",
  },
  {
    id: 2,
    title: "Configure seu Perfil",
    description: "Personalize suas preferências e configure suas informações básicas.",
    icon: Target,
    duration: "3 min",
    completed: false,
    href: "/perfil",
  },
  {
    id: 3,
    title: "Explore a Biblioteca de IAs",
    description: "Descubra as Ferramentas de IA de IA disponíveis no seu plano.",
    icon: Bot,
    duration: "10 min",
    completed: false,
    href: "/ias",
  },
  {
    id: 4,
    title: "Use seu Primeiro Prompt",
    description: "Acesse o Hub de Prompts e copie seu primeiro prompt para usar.",
    icon: FileText,
    duration: "5 min",
    completed: false,
    href: "/prompts",
  },
  {
    id: 5,
    title: "Assista sua Primeira Aula",
    description: "Comece sua jornada de aprendizado com nossos cursos exclusivos.",
    icon: GraduationCap,
    duration: "15 min",
    completed: false,
    href: "/aulas",
  },
];

const tutorials = [
  {
    id: 1,
    title: "Como acessar as ferramentas de IA",
    thumbnail: "https://placehold.co/400x225/1a1a2e/ffffff?text=Nucleo+IA",
    duration: "",
    views: "",
  },
  {
    id: 2,
    title: "Usando o Autenticador 2FA",
    thumbnail: "https://placehold.co/400x225/1a1a2e/ffffff?text=Nucleo+IA",
    duration: "",
    views: "",
  },
  {
    id: 3,
    title: "Criando seus próprios prompts",
    thumbnail: "https://placehold.co/400x225/1a1a2e/ffffff?text=Nucleo+IA",
    duration: "",
    views: "",
  },
  {
    id: 4,
    title: "Dicas para maximizar resultados",
    thumbnail: "https://placehold.co/400x225/1a1a2e/ffffff?text=Nucleo+IA",
    duration: "",
    views: "",
  },
];

const features = [
  { icon: Bot, title: "Lista de IA's", description: "Ferramentas de IA", href: "/ias" },
  { icon: FileText, title: "Prompts", description: "Prompts profissionais", href: "/prompts" },
  { icon: GraduationCap, title: "Aulas", description: "Cursos premium", href: "/aulas" },
  { icon: Crown, title: "Produtos VIP", description: "Recursos exclusivos", href: "/produtos" },
  { icon: Shield, title: "Autenticador", description: "Acesso 2FA", href: "/autenticador" },
];

const GetStarted = () => {
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </div>
          <Badge variant="warning">Início</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Comece Por Aqui</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Siga os passos abaixo para aproveitar ao máximo a plataforma NÚCLEO IA
        </p>
      </div>

      {/* Progress Card */}
      <GlassCard gradient className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Seu Progresso</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{completedSteps} de {steps.length} passos concluídos</p>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gradient">{Math.round(progressPercentage)}%</div>
        </div>
        <Progress value={progressPercentage} className="h-2.5 sm:h-3" />
      </GlassCard>

      {/* Steps */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Passos para Começar</h2>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <GlassCard
              key={step.id}
              className={`transition-all ${step.completed ? 'opacity-70' : ''}`}
              hover={!step.completed}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  step.completed
                    ? 'bg-success/20'
                    : 'bg-primary/20'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  ) : (
                    <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Passo {index + 1}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{step.duration}</span>
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{step.description}</p>
                </div>

                <div className="shrink-0">
                  {!step.completed && step.href && (
                    <Link to={step.href}>
                      <Button variant="gradient" size="sm" className="touch-target">
                        <span className="hidden xs:inline">Começar</span>
                        <ArrowRight className="h-4 w-4 xs:ml-1" />
                      </Button>
                    </Link>
                  )}
                  {!step.completed && !step.href && (
                    <Button variant="gradient" size="sm" className="touch-target">
                      <span className="hidden xs:inline">Começar</span>
                      <ArrowRight className="h-4 w-4 xs:ml-1" />
                    </Button>
                  )}
                  {step.completed && (
                    <Badge variant="success" className="text-[10px] sm:text-xs">Concluído</Badge>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Video Tutorials */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Tutoriais em Vídeo</h2>
          <Link to="/aulas" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tutorials.map((tutorial) => (
            <GlassCard key={tutorial.id} hover className="p-0 overflow-hidden cursor-pointer">
              <div className="aspect-video relative group">
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <PlayCircle className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                {tutorial.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs font-medium">
                  {tutorial.duration}
                </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-foreground line-clamp-2">{tutorial.title}</h4>
                {tutorial.views && (
                  <p className="text-xs text-muted-foreground mt-1">{tutorial.views} visualizações</p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Quick Access Features */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.href}>
              <GlassCard hover className="text-center py-4 sm:py-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h4 className="font-medium text-foreground text-xs sm:text-sm">{feature.title}</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <GlassCard gradient className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
              <Lightbulb className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Precisa de ajuda?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Nossa equipe está pronta para te ajudar.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            Falar com Suporte
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default GetStarted;