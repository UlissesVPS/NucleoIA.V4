import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  GraduationCap, 
  Monitor, 
  Key, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Rocket,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TutorialChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    id: 1,
    title: "Assista as Aulas Introdutórias",
    description: "Comece pelo módulo 'COMECE AQUI' para entender como a plataforma funciona",
    icon: GraduationCap,
    href: "/comece-aqui",
    gradient: "from-primary to-orange-500",
    priority: true,
    estimatedTime: "15 min"
  },
  {
    id: 2,
    title: "Configure o Dicloak",
    description: "Aprenda a acessar o navegador anti-detect para usar as ferramentas de IA",
    icon: Monitor,
    href: "/dicloak",
    gradient: "from-blue-500 to-cyan-500",
    priority: true,
    estimatedTime: "10 min"
  },
  {
    id: 3,
    title: "Entenda o Autenticador 2FA",
    description: "Saiba como gerar códigos de verificação para fazer login nas IAs",
    icon: Key,
    href: "/autenticador",
    gradient: "from-green-500 to-emerald-500",
    priority: true,
    estimatedTime: "5 min"
  },
  {
    id: 4,
    title: "Explore a Lista de IAs",
    description: "Conheça todas as ferramentas premium disponíveis para você",
    icon: Sparkles,
    href: "/ias",
    gradient: "from-purple-500 to-pink-500",
    priority: false,
    estimatedTime: "5 min"
  },
  {
    id: 5,
    title: "Descubra os Prompts Prontos",
    description: "Acesse milhares de prompts para criar conteúdos incríveis",
    icon: BookOpen,
    href: "/prompts",
    gradient: "from-orange-500 to-red-500",
    priority: false,
    estimatedTime: "10 min"
  }
];

const TutorialChecklistModal = ({ open, onOpenChange }: TutorialChecklistModalProps) => {
  const navigate = useNavigate();
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  const toggleStep = (stepId: number) => {
    setCheckedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const handleNavigate = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const completedCount = checkedSteps.length;
  const totalSteps = tutorialSteps.length;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl bg-card/95 backdrop-blur-xl border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-center pb-2 flex-shrink-0">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            🎯 Antes de Começar...
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Siga estes passos para aproveitar <span className="text-primary font-semibold">100%</span> da plataforma!
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-1 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Seu progresso</span>
            <span className="text-xs font-semibold text-primary">{completedCount}/{totalSteps} completos</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-orange-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-1 mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-orange-500/10 to-pink-500/10 border border-primary/30 flex-shrink-0"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                ⚠️ Importante: Assista as aulas primeiro!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sem entender o processo, você pode ter dificuldades para acessar as ferramentas corretamente.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Checklist */}
        <div className="space-y-3 py-4 overflow-y-auto flex-1 px-1">
          <AnimatePresence>
            {tutorialSteps.map((step, index) => {
              const isChecked = checkedSteps.includes(step.id);
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer group
                    ${isChecked 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border'
                    }
                    ${step.priority && !isChecked ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : ''}
                  `}
                  onClick={() => toggleStep(step.id)}
                >
                  {/* Priority Badge */}
                  {step.priority && !isChecked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-[10px] font-bold text-white shadow-lg"
                    >
                      ESSENCIAL
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`
                        w-6 h-6 rounded-lg flex items-center justify-center transition-all
                        ${isChecked 
                          ? 'bg-gradient-to-br from-primary to-orange-500' 
                          : 'bg-muted border border-border'
                        }
                      `}>
                        {isChecked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                      bg-gradient-to-br ${step.gradient}
                      ${isChecked ? 'opacity-60' : 'opacity-100'}
                    `}>
                      <StepIcon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-sm sm:text-base ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {step.title}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          ~{step.estimatedTime}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm mt-0.5 ${isChecked ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(step.href);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Entendi, vou explorar
          </Button>
          <Button
            variant="gradient"
            className="flex-1 gap-2"
            onClick={() => handleNavigate("/comece-aqui")}
          >
            <GraduationCap className="w-4 h-4" />
            Começar Pelas Aulas
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Tip */}
        <p className="text-center text-[10px] text-muted-foreground mt-2 flex-shrink-0">
          💡 Marque os itens conforme for completando para acompanhar seu progresso!
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialChecklistModal;
