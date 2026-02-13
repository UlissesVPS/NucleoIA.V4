import { useState, useEffect, useCallback } from "react";
import { useSharedCredentials, useUpdateSharedCredential } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Key, Copy, Check, Shield, ChevronRight, Eye, EyeOff, Save, Loader2, Pencil, Fingerprint, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrbitingAILogos from "@/components/OrbitingAILogos";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Simulated generation steps
const GENERATION_STEPS = [
  "Verificando identidade...",
  "Conectando ao servidor seguro...",
  "Gerando credenciais exclusivas...",
  "Criptografando dados...",
  "Credenciais prontas!",
];

const Dicloak = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { data: credentialsList, isLoading } = useSharedCredentials({ service: 'Dicloak' });
  const updateCredential = useUpdateSharedCredential();

  const credential = credentialsList?.[0] || null;

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  // Super Admin edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Member generation simulation state
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [scrambledEmail, setScrambledEmail] = useState("");
  const [scrambledPassword, setScrambledPassword] = useState("");
  const [revealProgress, setRevealProgress] = useState(0);

  // Sync edit fields when credential loads
  useEffect(() => {
    if (credential) {
      setEditEmail(credential.username || "");
      setEditPassword(credential.password || "");
    }
  }, [credential]);

  const email = credential?.username || "";
  const password = credential?.password || "";

  // Scramble text effect — reveals real chars progressively
  const scrambleText = useCallback((realText: string, progress: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.!#$%";
    const revealCount = Math.floor((progress / 100) * realText.length);
    return realText
      .split("")
      .map((char, i) => {
        if (i < revealCount) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");
  }, []);

  // Generation animation
  const handleGenerate = useCallback(() => {
    if (!credential) return;
    setIsGenerating(true);
    setGenerationStep(0);
    setRevealProgress(0);

    // Step through generation messages
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < GENERATION_STEPS.length) {
        setGenerationStep(step);
      } else {
        clearInterval(stepInterval);
      }
    }, 600);

    // Scramble → reveal effect (runs during the last ~1.5s)
    setTimeout(() => {
      let progress = 0;
      const revealInterval = setInterval(() => {
        progress += 4;
        setRevealProgress(progress);
        setScrambledEmail(scrambleText(email, progress));
        setScrambledPassword(scrambleText(password, progress));
        if (progress >= 100) {
          clearInterval(revealInterval);
          setScrambledEmail(email);
          setScrambledPassword(password);
          setIsGenerating(false);
          setHasGenerated(true);
        }
      }, 40);
    }, GENERATION_STEPS.length * 600 - 1000);
  }, [credential, email, password, scrambleText]);

  const handleCopy = (text: string, type: "email" | "password") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!credential?.id) return;
    try {
      await updateCredential.mutateAsync({
        id: credential.id,
        username: editEmail,
        password: editPassword,
      });
      toast.success("Credenciais atualizadas com sucesso!");
      setIsEditing(false);
    } catch {
      toast.error("Erro ao atualizar credenciais");
    }
  };

  // Super Admin always sees credentials directly
  const showCredentials = isSuperAdmin || hasGenerated;

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Orbiting AI Logos Background */}
      <div className="hidden md:block">
        <OrbitingAILogos />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative rounded-2xl overflow-hidden bg-card">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-accent to-pink" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex justify-center mb-4">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/30">
                  <Key className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Acesso Dicloak</h1>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin ? "Credenciais da conta Membro" : "Suas credenciais de acesso exclusivo"}
                </p>
              </div>

              {/* Loading from API */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* ===== MEMBER: Generate Button (before generation) ===== */}
                  {!isSuperAdmin && !hasGenerated && !isGenerating && (
                    <div className="space-y-5 mb-6">
                      <div className="text-center space-y-3">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                          <Fingerprint className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Clique no botão abaixo para gerar suas credenciais de acesso pessoal ao Dicloak.
                        </p>
                      </div>
                      <Button
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 rounded-xl"
                        onClick={handleGenerate}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Gerar Minhas Credenciais
                      </Button>
                    </div>
                  )}

                  {/* ===== MEMBER: Generation Animation ===== */}
                  {!isSuperAdmin && isGenerating && (
                    <div className="space-y-5 mb-6">
                      {/* Progress bar */}
                      <div className="space-y-3">
                        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${Math.min(revealProgress > 0 ? 70 + (revealProgress * 0.3) : (generationStep / (GENERATION_STEPS.length - 1)) * 70, 100)}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>

                        {/* Step messages */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={generationStep}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {GENERATION_STEPS[generationStep]}
                            </span>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Scrambled fields preview */}
                      {revealProgress > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground/60 truncate">
                            {scrambledEmail}
                          </div>
                          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground/60">
                            {scrambledPassword}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ===== SUPER ADMIN: Edit Mode ===== */}
                  {isSuperAdmin && isEditing && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">E-mail</label>
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          className="h-11 rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Senha</label>
                        <Input
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Nova senha"
                          className="h-11 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* ===== Credentials View (Super Admin always, Member after generation) ===== */}
                  {showCredentials && !(isSuperAdmin && isEditing) && (
                    <motion.div
                      initial={!isSuperAdmin ? { opacity: 0, scale: 0.95 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4 mb-6"
                    >
                      {/* Email field */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">E-mail</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono truncate">
                            {email}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-11 w-11 rounded-xl border border-border hover:bg-primary/10 hover:border-primary/30 transition-all ${
                              copied === "email" ? "text-success border-success/30" : "text-muted-foreground"
                            }`}
                            onClick={() => handleCopy(email, "email")}
                          >
                            {copied === "email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Password field */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Senha</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono">
                            {showPassword ? password : "••••••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-xl border border-border hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-11 w-11 rounded-xl border border-border hover:bg-primary/10 hover:border-primary/30 transition-all ${
                              copied === "password" ? "text-success border-success/30" : "text-muted-foreground"
                            }`}
                            onClick={() => handleCopy(password, "password")}
                          >
                            {copied === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== Super Admin Actions ===== */}
                  {isSuperAdmin && (
                    isEditing ? (
                      <div className="flex gap-3 mb-4">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 rounded-xl"
                          onClick={() => {
                            setIsEditing(false);
                            setEditEmail(credential?.username || "");
                            setEditPassword(credential?.password || "");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 rounded-xl"
                          onClick={handleSave}
                          disabled={updateCredential.isPending}
                        >
                          {updateCredential.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Save className="h-5 w-5 mr-2" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 rounded-xl mb-4"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-5 w-5 mr-2" />
                        Editar Credenciais
                      </Button>
                    )
                  )}

                  {/* Footer text */}
                  {showCredentials && (
                    <p className="text-center text-xs text-muted-foreground mb-6">
                      {isSuperAdmin
                        ? "Credenciais compartilhadas com todos os membros"
                        : "Credenciais geradas exclusivamente para sua conta"
                      }
                    </p>
                  )}
                </>
              )}

              {/* 2FA Link */}
              <motion.div
                onClick={() => navigate("/autenticador")}
                className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20 hover:border-success/40 transition-all cursor-pointer group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-success mb-0.5">Precisa do código 2FA?</h4>
                  <p className="text-xs text-success/60">Acesse o Autenticador para gerar seu código</p>
                </div>
                <ChevronRight className="w-4 h-4 text-success group-hover:translate-x-0.5 transition-transform" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dicloak;
