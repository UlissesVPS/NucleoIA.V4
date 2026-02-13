import { Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson, Course } from "@/types";

interface LessonCardProps {
  lesson: Lesson & { moduleTitle?: string };
  course: Course;
  onClick: () => void;
  progressPercent?: number;
}

const LessonCard = ({
  lesson,
  course,
  onClick,
  progressPercent = 0,
}: LessonCardProps) => {
  const isCompleted = lesson.completed;
  const hasProgress = progressPercent > 0 && !isCompleted;

  // Calculate remaining time if there's progress
  const remainingSeconds = lesson.durationSeconds * (1 - progressPercent / 100);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);

  return (
    <div
      onClick={onClick}
      className="relative flex-shrink-0 w-[220px] cursor-pointer group"
    >
      <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={lesson.thumbnail}
            alt={lesson.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 className="h-5 w-5 text-success fill-success/20" />
            </div>
          )}

          {/* Progress bar (Netflix style) */}
          {(hasProgress || isCompleted) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
              <div
                className={cn(
                  "h-full transition-all",
                  isCompleted ? "bg-success w-full" : "bg-primary"
                )}
                style={{ width: isCompleted ? "100%" : `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1">
          <h4 className={cn(
            "font-medium text-sm line-clamp-1 transition-colors",
            isCompleted ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
          )}>
            {lesson.title}
          </h4>
          
          <p className="text-xs text-muted-foreground line-clamp-1">
            {lesson.moduleTitle || course.title}
          </p>
          
          <p className="text-xs text-muted-foreground">
            {hasProgress ? (
              <span className="text-primary">{remainingMinutes} min restantes</span>
            ) : (
              lesson.duration
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;
