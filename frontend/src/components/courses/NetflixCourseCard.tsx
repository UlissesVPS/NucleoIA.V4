import { Play, BookOpen } from "lucide-react";
import type { Course } from "@/types";

interface NetflixCourseCardProps {
  course: Course;
  onClick: () => void;
  onPlay: () => void;
}

const NetflixCourseCard = ({
  course,
  onClick,
  onPlay,
}: NetflixCourseCardProps) => {
  const isNewCourse =
    course.isNew ||
    new Date().getTime() - new Date(course.createdAt).getTime() <
      7 * 24 * 60 * 60 * 1000;

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {/* Card container */}
      <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10">
        {/* Thumbnail — fills 100% */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-[0.3] max-md:brightness-75"
        />

        {/* Badge Novo */}
        {isNewCourse && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="px-2 py-0.5 rounded-lg bg-accent text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
              🚀 Novo
            </span>
          </div>
        )}

        {/* Progress bar */}
        {course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-20">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}

        {/* Permanent bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-[1]" />

        {/* Overlay — slides up on hover (always visible on mobile) */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 max-md:translate-y-0 transition-transform duration-300 ease-out">
          <div
            className="pt-12 pb-4 px-3"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(88,28,135,0.85) 60%, transparent 100%)",
            }}
          >
            {/* Lessons count + progress */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              <span>{course.totalLessons} aulas</span>
              {course.progress > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-primary font-medium">
                    {course.progress}%
                  </span>
                </>
              )}
            </div>

            {/* Play button + label */}
            <button
              className="flex items-center gap-2.5 group/play"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              <div className="w-9 h-9 rounded-full border-2 border-white/80 bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all group-hover/play:bg-white/25 group-hover/play:scale-105">
                <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" />
              </div>
              <span className="text-white text-sm font-medium">
                {course.progress > 0 ? "Continuar" : "Reproduzir"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* External title — always visible below card */}
      <h3 className="text-foreground font-semibold text-sm mt-2 line-clamp-2 leading-tight">
        {course.title}
      </h3>
    </div>
  );
};

export default NetflixCourseCard;
