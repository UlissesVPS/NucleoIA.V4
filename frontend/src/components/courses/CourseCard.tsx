import { Play, Clock, BookOpen, Pencil, Trash2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Badge from "@/components/Badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CourseCard = ({
  course,
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
}: CourseCardProps) => {
  const isNewCourse = course.isNew || 
    (new Date().getTime() - new Date(course.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Admin Actions */}
      {isAdmin && onEdit && onDelete && (
        <div className="absolute top-3 right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-8 w-8 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Pencil className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 rounded-lg bg-destructive/90 backdrop-blur-sm border border-destructive/50 flex items-center justify-center hover:bg-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center shadow-xl">
            <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isNewCourse && (
            <Badge variant="warning" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Novo
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {course.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-muted/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.modules.length} módulos • {course.totalLessons} aulas
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.totalDuration}
          </span>
        </div>

        {/* Progress info */}
        {course.progress > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-primary">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
