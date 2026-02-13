import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, MessageCircle, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AITool } from "@/types";

interface CanvaAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: AITool | null;
}

const CanvaAccessModal = ({ open, onOpenChange, tool }: CanvaAccessModalProps) => {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    const phoneNumber = "5586999567284";
    const message = encodeURIComponent(
      "Olá! Sou membro da plataforma e gostaria de solicitar meu acesso individual ao Canva Pro. Poderia me enviar o convite por e-mail? Obrigado!"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleNavigateToCourses = () => {
    onOpenChange(false);
    navigate("/cursos");
  };

  if (!tool) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-16 h-16 rounded-xl overflow-hidden border border-border/50 shadow-lg">
            <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Como acessar {tool.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            O acesso ao Canva Pro é <strong className="text-primary">individual</strong> e você receberá um link de convite pelo WhatsApp.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 - WhatsApp */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 hover:from-green-500/20 hover:to-green-600/20 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">1º Passo</span>
                Solicite seu Acesso
              </h4>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem no <strong className="text-foreground">WhatsApp</strong> solicitando seu acesso individual ao Canva Pro.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-green-500 hover:text-green-400 p-0 h-auto"
                onClick={handleWhatsAppClick}
              >
                Abrir WhatsApp <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Step 2 - Receive Link */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">2º Passo</span>
                Receba o Link de Convite
              </h4>
              <p className="text-sm text-muted-foreground">
                Nossa equipe da <strong className="text-foreground">Núcleo IA</strong> enviará o link de convite diretamente no seu WhatsApp.
              </p>
            </div>
          </div>

          {/* Step 3 - Courses */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 hover:from-primary/20 hover:to-accent/20 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Dúvidas?</span>
                Assista às Aulas
              </h4>
              <p className="text-sm text-muted-foreground">
                Temos <strong className="text-foreground">aulas detalhadas</strong> com todo o passo a passo de como usar o Canva Pro!
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-primary hover:text-primary/80 p-0 h-auto"
                onClick={handleNavigateToCourses}
              >
                Ver Cursos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            variant="premium-outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            variant="premium" 
            className="flex-1 !bg-gradient-to-r !from-green-500/25 !to-green-600/20 !border-green-500/30 hover:!from-green-500/35 hover:!to-green-600/30"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Solicitar Acesso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CanvaAccessModal;
