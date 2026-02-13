import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

interface HeroBannerProps {
  courses: Course[];
  onContinue: (course: Course) => void;
  onDetails: (course: Course) => void;
  customBanner?: {
    imageUrl?: string | null;
    title?: string | null;
    subtitle?: string | null;
  };
}

const HeroBanner = ({ courses, onContinue, onDetails, customBanner }: HeroBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (courses.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % courses.length);
        setIsTransitioning(false);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [courses.length]);

  if (courses.length === 0) return null;

  const course = courses[currentIndex];
  const hasProgress = course.progress > 0;

  const goTo = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative w-full h-[55vh] min-h-[400px] max-h-[550px] overflow-hidden rounded-2xl">
      {/* Background Image */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        <img
          src={customBanner?.imageUrl || course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {/* Content */}
      <div 
        className={cn(
          "absolute bottom-12 left-8 right-8 max-w-2xl transition-all duration-500",
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        {/* Fire badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center gap-1.5">
            🔥 Em Destaque
          </span>
          {course.isNew && (
            <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold">
              Novo
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
          {customBanner?.title || course.title}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-base md:text-lg mb-4 line-clamp-2 max-w-xl">
          {course.description}
        </p>

        {/* Custom subtitle */}
        {customBanner?.subtitle && (
          <p className="text-accent text-base md:text-lg font-medium mb-2">{customBanner.subtitle}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{course.modules.length} módulos</span>
          <span>•</span>
          <span>{course.totalLessons} aulas</span>
          <span>•</span>
          <span>{course.totalDuration}</span>
        </div>

        {/* Progress */}
        {hasProgress && (
          <div className="mb-5 max-w-md">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Seu progresso</span>
              <span className="text-primary font-semibold">{course.progress}% concluído</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="gradient"
            size="lg"
            className="gap-2 px-6 shadow-lg shadow-primary/25"
            onClick={() => onContinue(course)}
          >
            <Play className="h-5 w-5" fill="currentColor" />
            {hasProgress ? "Continuar Assistindo" : "Começar Curso"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 bg-muted/50 border-muted-foreground/30 hover:bg-muted"
            onClick={() => onDetails(course)}
          >
            <Info className="h-5 w-5" />
            Ver Detalhes
          </Button>
        </div>
      </div>

      {/* Navigation arrows */}
      {courses.length > 1 && (
        <>
          <button
            onClick={() => goTo((currentIndex - 1 + courses.length) % courses.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goTo((currentIndex + 1) % courses.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {courses.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {courses.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/50 hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
