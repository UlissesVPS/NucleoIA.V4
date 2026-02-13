import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Key, GraduationCap, ExternalLink, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AITool } from "@/types";

interface AIAccessInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: AITool | null;
}

const AIAccessInstructionsModal = ({ open, onOpenChange, tool }: AIAccessInstructionsModalProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
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
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 - Dicloak */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">1º Passo</span>
                Acesse o Dicloak
              </h4>
              <p className="text-sm text-muted-foreground">
                Entre no Dicloak utilizando suas <strong className="text-foreground">credenciais corretas</strong> fornecidas na plataforma.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-primary hover:text-primary/80 p-0 h-auto"
                onClick={() => handleNavigate("/dicloak")}
              >
                Ir para Dicloak <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Step 2 - Authenticator */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">2º Passo</span>
                Pegue o Código 2FA
              </h4>
              <p className="text-sm text-muted-foreground">
                Acesse o <strong className="text-foreground">Autenticador</strong> para gerar o código de verificação necessário para login.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-success hover:text-success/80 p-0 h-auto"
                onClick={() => handleNavigate("/autenticador")}
              >
                Ir para Autenticador <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
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
                Temos <strong className="text-foreground">aulas detalhadas</strong> com todo o passo a passo nos mínimos detalhes de como acessar cada ferramenta!
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-primary hover:text-primary/80 p-0 h-auto"
                onClick={() => handleNavigate("/cursos")}
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
            className="flex-1"
            onClick={() => handleNavigate("/dicloak")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Começar Agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAccessInstructionsModal;
