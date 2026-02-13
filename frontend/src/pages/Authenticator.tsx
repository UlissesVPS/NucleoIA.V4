import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, RefreshCw, Copy, Check, Key, ChevronRight, AlertTriangle, MessageCircle, GraduationCap, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrbitingAILogos from "@/components/OrbitingAILogos";
import { toast } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTotpStatus, useGenerateTotp, useTotpCurrentCode } from "@/hooks/useApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SESSION_DURATION = 180000; // 3 minutes in ms

const Authenticator = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: status, isLoading: statusLoading } = useTotpStatus("Dicloak");
  const generateTotp = useGenerateTotp();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cycle, setCycle] = useState(30);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showLimitReachedDialog, setShowLimitReachedDialog] = useState(false);
  const [showInitialAlert, setShowInitialAlert] = useState(true);

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const sessionExpiryRef = useRef<number>(0);

  // Auto-refresh query — only enabled when session is active
  const { data: refreshData } = useTotpCurrentCode("Dicloak", sessionActive);

  const usedCodes = status?.usedThisMonth ?? 0;
  const maxCodes = status?.maxAllowed ?? 3;
  const isUnlimited = status?.isUnlimited ?? false;
  const remainingAttempts = isUnlimited ? Infinity : maxCodes - usedCodes;

  // Update code from auto-refresh
  useEffect(() => {
    if (refreshData?.code && sessionActive) {
      const raw = refreshData.code as string;
      const formatted = raw.slice(0, 3) + " " + raw.slice(3);
      setCode(formatted);
    }
  }, [refreshData, sessionActive]);

  // 30s TOTP cycle countdown + session timer
  useEffect(() => {
    const tick = () => {
      const epoch = Math.floor(Date.now() / 1000);
      setCycle(30 - (epoch % 30));

      // Session countdown
      if (sessionActive && sessionExpiryRef.current > 0) {
        const remaining = sessionExpiryRef.current - Date.now();
        if (remaining <= 0) {
          setSessionActive(false);
          setCode(null);
          setSessionTimeLeft(0);
          sessionExpiryRef.current = 0;
        } else {
          setSessionTimeLeft(remaining);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code.replace(" ", ""));
      setCopied(true);
      toast.success("Codigo copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateClick = () => {
    if (isUnlimited) {
      doGenerate();
    } else if (usedCodes >= maxCodes) {
      setShowLimitReachedDialog(true);
    } else {
      setShowWarningDialog(true);
    }
  };

  const doGenerate = async () => {
    try {
      const result = await generateTotp.mutateAsync("Dicloak");
      const raw = result.code as string;
      const formatted = raw.slice(0, 3) + " " + raw.slice(3);
      setCode(formatted);

      // Start 3-minute session
      sessionExpiryRef.current = Date.now() + SESSION_DURATION;
      setSessionActive(true);
      setSessionTimeLeft(SESSION_DURATION);

      toast.success(isUnlimited ? "Codigo gerado (Admin)" : "Codigo gerado! Sessao ativa por 3 minutos.");
    } catch (error: any) {
      const errCode = error?.response?.data?.error?.code;
      if (errCode === "TOTP_LIMIT_REACHED") {
        toast.error("Limite mensal atingido.");
        setShowLimitReachedDialog(true);
      } else if (errCode === "TOTP_NO_SECRET") {
        toast.error("Segredo TOTP nao configurado. Contate o administrador.");
      } else {
        toast.error("Erro ao gerar codigo. Tente novamente.");
      }
    }
  };

  const handleConfirmGenerate = () => {
    setShowWarningDialog(false);
    doGenerate();
  };

  const handleContactSupport = () => {
    const phoneNumber = "5586999567284";
    const message = encodeURIComponent(
      "Ola! Sou membro da Nucleo IA e atingi o limite de 3 codigos 2FA este mes. Preciso de suporte para acessar minha conta. Podem me ajudar?"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    setShowLimitReachedDialog(false);
  };

  const getProgressColor = () => {
    if (cycle > 20) return "bg-primary";
    if (cycle > 10) return "bg-gradient-to-r from-primary to-accent";
    return "bg-accent";
  };

  const formatSessionTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const sessionProgress = sessionTimeLeft / SESSION_DURATION;

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <OrbitingAILogos />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Initial Alert for Members */}
        <AnimatePresence>
          {!isUnlimited && showInitialAlert && !sessionActive && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6"
            >
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 relative">
                <button
                  onClick={() => setShowInitialAlert(false)}
                  className="absolute top-2 right-3 text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  &times;
                </button>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm">Atencao, Membro!</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Voce tem apenas <strong className="text-foreground">{maxCodes} tentativas por mes</strong>.
                      Assista a aula antes de usar!
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 h-7 px-2 text-xs"
                      onClick={() => navigate("/aulas")}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Assistir Aula
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "rgba(24, 24, 27, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Gradient bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, #f97316, #a855f7, #ec4899, #06b6d4)" }}
            />

            <div className="p-6 sm:p-8">
              <div className="flex justify-center mb-4">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/30">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Autenticador 2FA</h1>
                <p className="text-sm text-muted-foreground">Codigo sincronizado com Dicloak</p>
              </div>

              {/* Usage Status */}
              <div className="mb-6">
                {statusLoading ? (
                  <div className="flex items-center justify-center p-3 rounded-lg bg-muted/30 border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : isUnlimited ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <span className="text-sm text-muted-foreground">Modo Admin:</span>
                    <div className="flex items-center gap-1.5 text-success">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold text-sm">ILIMITADO</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Tentativas usadas:</span>
                      <span className="text-sm font-medium text-foreground">{usedCodes}/{maxCodes}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[...Array(maxCodes)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full ${i < usedCodes ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    {remainingAttempts > 0 ? (
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        {remainingAttempts === 1 ? "Ultima tentativa restante!" : `${remainingAttempts} tentativas restantes`}
                      </p>
                    ) : (
                      <p className="text-xs text-center mt-2 text-destructive">Limite atingido</p>
                    )}
                  </div>
                )}
              </div>

              {/* Session Timer Banner */}
              <AnimatePresence>
                {sessionActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Sessao ativa</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-primary">
                          {formatSessionTime(sessionTimeLeft)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${sessionProgress * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] text-primary/60 mt-1.5 text-center">
                        Codigo atualiza automaticamente a cada 30s
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code Display */}
              <AnimatePresence>
                {code && (
                  <motion.div
                    className="text-center mb-6 p-5 rounded-xl bg-muted/30 border border-border relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    <motion.p
                      key={code}
                      initial={{ opacity: 0.5, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl sm:text-5xl font-mono font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-[0.2em] mb-4"
                    >
                      {code}
                    </motion.p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className={`gap-2 ${copied ? "text-success" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar Codigo
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              {!sessionActive && (
                <Button
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 rounded-xl mb-3"
                  onClick={handleGenerateClick}
                  disabled={generateTotp.isPending || (!isUnlimited && usedCodes >= maxCodes)}
                >
                  {generateTotp.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : !isUnlimited && usedCodes >= maxCodes ? (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Limite Atingido
                    </>
                  ) : (
                    "Gerar Codigo 2FA"
                  )}
                </Button>
              )}

              {!isUnlimited && !sessionActive && usedCodes < maxCodes && (
                <p className="text-center text-xs text-primary/80 mb-4">
                  Sessao ativa por 3 minutos (consumira 1 tentativa)
                </p>
              )}

              {!isUnlimited && !sessionActive && usedCodes >= maxCodes && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mb-4 gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowLimitReachedDialog(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com Suporte
                </Button>
              )}

              {/* 30s Cycle Timer */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Ciclo do codigo:
                  </span>
                  <span className={`font-medium ${cycle <= 5 ? "text-accent" : cycle <= 10 ? "text-amber-500" : "text-foreground"}`}>
                    {cycle}s
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getProgressColor()}`}
                    style={{ width: `${(cycle / 30) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Link to Dicloak credentials */}
              <motion.div
                onClick={() => navigate("/dicloak")}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground mb-0.5">Precisa das credenciais?</h4>
                  <p className="text-xs text-muted-foreground">Acesse o Dicloak para copiar login</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </motion.div>

              {/* Admin badge */}
              {isUnlimited && (
                <motion.div
                  className="mt-4 p-3 rounded-xl bg-success/10 border border-success/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-medium text-success">Modo Administrativo</p>
                      <p className="text-xs text-success/70">Voce pode gerar codigos ilimitados.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="bg-card border-border max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg text-foreground">
              Atencao! {remainingAttempts === Infinity ? "" : `${remainingAttempts} ${remainingAttempts === 1 ? "tentativa" : "tentativas"} restante${remainingAttempts !== 1 ? "s" : ""}`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 text-muted-foreground">
              <p className="text-sm">
                Cada codigo gerado consome <strong className="text-foreground">1 tentativa</strong> do seu limite mensal.
              </p>
              <p className="text-sm">
                O codigo ficara ativo por <strong className="text-foreground">3 minutos</strong>, atualizando automaticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <Button
              variant="ghost"
              className="w-full sm:w-auto gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              onClick={() => {
                setShowWarningDialog(false);
                navigate("/aulas");
              }}
            >
              <GraduationCap className="h-4 w-4" />
              Ver Aula
            </Button>
            <AlertDialogAction
              onClick={handleConfirmGenerate}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0"
            >
              Gerar Codigo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit Reached Dialog */}
      <AlertDialog open={showLimitReachedDialog} onOpenChange={setShowLimitReachedDialog}>
        <AlertDialogContent className="bg-card border-border max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg text-foreground">
              Limite de Codigos Atingido!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 text-muted-foreground">
              <p className="text-sm">
                Voce ja utilizou todos os seus <strong className="text-foreground">{maxCodes} codigos 2FA</strong> disponiveis este mes.
              </p>
              <p className="text-sm">
                Para continuar, entre em contato com nosso <strong className="text-foreground">suporte via WhatsApp</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Fechar</AlertDialogCancel>
            <Button
              onClick={handleContactSupport}
              className="w-full sm:w-auto bg-success hover:bg-success/90 text-white gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Falar no WhatsApp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Authenticator;
