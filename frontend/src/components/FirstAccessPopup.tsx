import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, PlayCircle, ArrowRight, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FirstAccessPopupProps {
  memberName: string;
  onGoToLesson: () => void;
  onDismiss: () => void;
}

const COURSE_ROUTE = "/aulas/00c1c024-cba9-43bb-9dac-dac6b6eda57d";

const FirstAccessPopup = ({ memberName, onGoToLesson, onDismiss }: FirstAccessPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Delay entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onDismiss(), 200);
  }, [onDismiss]);

  const handleGoToLesson = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onGoToLesson(), 200);
  }, [onGoToLesson]);

  // Click outside modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.92, y: isVisible ? 0 : 20 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(to bottom, #1e1e3a, #1a1a2e)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(249, 115, 22, 0.08)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Bem-vindo ao Nucleo IA"
          >
            {/* Top gradient bar */}
            <div
              className="h-[3px] w-full"
              style={{ background: "linear-gradient(90deg, #f97316, #a855f7, #ec4899, #06b6d4)" }}
            />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Icon header */}
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: isVisible ? 1 : 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      boxShadow: "0 8px 24px rgba(249, 115, 22, 0.35)",
                    }}
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-2xl animate-pulse" style={{
                    boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
                  }} />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Bem-vindo ao Nucleo IA!
              </h2>

              {/* Message */}
              <p className="text-sm text-gray-400 text-center leading-relaxed mb-6 max-w-[320px] mx-auto">
                Ola, <span className="text-white font-medium">{memberName}</span>! Preparamos um
                passo a passo para voce configurar tudo e comecar a usar as ferramentas de IA.
              </p>

              {/* Lesson card */}
              <div
                className="flex items-start gap-3.5 p-4 rounded-xl mb-6 cursor-pointer group transition-all duration-200 hover:border-orange-500/30"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
                onClick={handleGoToLesson}
              >
                <div
                  className="flex-shrink-0 h-11 w-11 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: "rgba(249, 115, 22, 0.15)" }}
                >
                  <PlayCircle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-orange-400 transition-colors">
                    COMO ACESSAR AS FERRAMENTAS
                  </h3>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Modulo Inicial
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Video className="h-3 w-3" />
                    <span>Video tutorial completo</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </div>

              {/* CTA button */}
              <button
                onClick={handleGoToLesson}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-[15px] flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(to right, #f97316, #ea580c)",
                  boxShadow: "0 4px 16px rgba(249, 115, 22, 0.3)",
                }}
              >
                Assistir Agora
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Skip link */}
              <div className="text-center mt-4">
                <button
                  onClick={handleClose}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors underline-offset-4 hover:underline"
                >
                  Pular por enquanto
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstAccessPopup;
