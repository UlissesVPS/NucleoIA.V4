import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Lesson } from "@/types";

interface NextLessonOverlayProps {
  nextLesson: Lesson & { moduleTitle?: string };
  onPlay: () => void;
  onCancel: () => void;
  countdownSeconds?: number;
}

const NextLessonOverlay = ({
  nextLesson,
  onPlay,
  onCancel,
  countdownSeconds = 5,
}: NextLessonOverlayProps) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onPlay();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onPlay]);

  const progressValue = ((countdownSeconds - timeLeft) / countdownSeconds) * 100;

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
      <div className="max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-lg text-muted-foreground mb-1">Próxima aula em</p>
          <p className="text-5xl font-bold text-primary">{timeLeft}s</p>
        </div>

        {/* Lesson card */}
        <div className="flex gap-4 p-4 rounded-xl bg-card border border-border mb-6">
          <div className="w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={nextLesson.thumbnail}
              alt={nextLesson.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">
              {nextLesson.moduleTitle}
            </p>
            <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
              {nextLesson.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Duração: {nextLesson.duration}
            </p>
          </div>
        </div>

        {/* Countdown progress */}
        <Progress value={progressValue} className="h-1.5 mb-6" />

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="gradient"
            size="lg"
            className="gap-2 px-8"
            onClick={onPlay}
          >
            <Play className="h-5 w-5" fill="currentColor" />
            Reproduzir Agora
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NextLessonOverlay;
