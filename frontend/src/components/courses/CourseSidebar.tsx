import { useState } from "react";
import { ChevronDown, ChevronRight, Play, Check, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, Module, Lesson } from "@/types";

interface CourseSidebarProps {
  course: Course;
  currentLessonId: number;
  onLessonSelect: (lesson: Lesson, moduleId?: string | number) => void;
  isAdmin?: boolean;
}

const CourseSidebar = ({
  course,
  currentLessonId,
  onLessonSelect,
  isAdmin = false,
}: CourseSidebarProps) => {
  const [expandedModules, setExpandedModules] = useState<number[]>(
    // Expand module containing current lesson
    course.modules
      .filter((m) => m.lessons.some((l) => l.id === currentLessonId))
      .map((m) => m.id)
  );

  const toggleModule = (moduleId: string | number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonIcon = (lesson: Lesson, isActive: boolean) => {
    if (isActive) {
      return (
        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Play className="h-3 w-3 text-primary-foreground" fill="currentColor" />
        </div>
      );
    }
    if (lesson.completed) {
      return (
        <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
          <Check className="h-3 w-3 text-success" />
        </div>
      );
    }
    return (
      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      </div>
    );
  };

  return (
    <div className="h-full bg-[#111] border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground line-clamp-2">{course.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {course.modules.length} módulos • {course.totalLessons} aulas
        </p>
      </div>

      <div className="p-2">
        {course.modules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          const completedLessons = module.lessons.filter((l) => l.completed).length;
          const totalLessons = module.lessons.length;
          const moduleProgress = Math.round((completedLessons / totalLessons) * 100);

          return (
            <div key={module.id} className="mb-1">
              {/* Module header */}
              <button
                onClick={() => toggleModule(module.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors",
                  "hover:bg-muted",
                  isExpanded && "bg-muted/50"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {module.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${moduleProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {completedLessons}/{totalLessons}
                    </span>
                  </div>
                </div>
              </button>

              {/* Lessons - Netflix style */}
              {isExpanded && (
                <div className="ml-2 space-y-0.5 py-1">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson, module.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all duration-200",
                          "hover:bg-white/5",
                          isActive && "bg-primary/10 border-l-2 border-primary"
                        )}
                      >
                        {getLessonIcon(lesson, isActive)}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm truncate transition-colors",
                              isActive ? "text-primary font-medium" : "text-foreground",
                              lesson.completed && !isActive && "text-muted-foreground/70"
                            )}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {lesson.duration}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseSidebar;
