import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Clock, BookOpen, Eye, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import VideoPlayer from "@/components/video/VideoPlayer";
import CourseSidebar from "@/components/courses/CourseSidebar";
import { toast } from "sonner";
import { useCourse, useUpdateLessonProgress } from "@/hooks/useApi";
import { getAllLessons, calculateProgress } from "@/utils/courses";
import RichContentRenderer from "@/components/RichContentRenderer";
import type { Course, Lesson } from "@/types";

const CourseDetail = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const { data: course, isLoading, error } = useCourse(cursoId || '');
  const updateProgress = useUpdateLessonProgress();
  
  const [currentLessonId, setCurrentLessonId] = useState<string | number | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Curso não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/aulas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Cursos
        </Button>
      </div>
    );
  }

  const allLessons = getAllLessons(course);
  
  const currentLesson = currentLessonId 
    ? allLessons.find(l => l.id === currentLessonId) || allLessons[0]
    : allLessons.find(l => !l.completed) || allLessons[0];

  if (!currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Este curso ainda não possui aulas</p>
        <Button variant="outline" onClick={() => navigate("/aulas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Cursos
        </Button>
      </div>
    );
  }

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLessonId(lesson.id);
  };

  const handlePrevious = () => {
    if (hasPrevious) setCurrentLessonId(allLessons[currentIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) setCurrentLessonId(allLessons[currentIndex + 1].id);
  };

  const handleMarkComplete = async () => {
    try {
      await updateProgress.mutateAsync({
        lessonId: String(currentLesson.id),
        completed: true,
        progressPct: 100,
      });
      toast.success("Aula marcada como concluída!");
    } catch {
      toast.error("Erro ao marcar aula como concluída");
    }
  };

  const handleVideoEnded = () => {
    if (!currentLesson.completed) handleMarkComplete();
    if (hasNext) {
      toast("Ir para próxima aula?", {
        action: { label: "Próxima", onClick: handleNext },
      });
    }
  };

  const progress = calculateProgress(course);
  const completedLessons = allLessons.filter((l) => l.completed).length;
  const modules = course.modules || [];

  return (
    <div className="animate-fade-in -mx-3 -mt-4 sm:-mx-4 sm:-mt-6 md:-mx-6 md:-mt-8">
      {isAdmin && !isAdminMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-3 sm:px-6 py-2 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-primary">
            <Eye className="h-4 w-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Modo Preview - </span>Visualizando como membro
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsAdminMode(true)}>Modo Admin</Button>
        </div>
      )}

      {isAdmin && isAdminMode && (
        <div className="bg-accent/10 border-b border-accent/20 px-3 sm:px-6 py-2 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-accent">Modo Admin - Editando curso</span>
          <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)}>
            <Eye className="h-4 w-4 mr-1 sm:mr-2" />Preview
          </Button>
        </div>
      )}

      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border">
        <Link to="/aulas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4">
          <ArrowLeft className="h-4 w-4" />Voltar aos Cursos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2 line-clamp-2">{course.title}</h1>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span>{modules.length} módulos</span>
              <span>•</span>
              <span>{course.totalLessons || allLessons.length} aulas</span>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:inline">{course.totalDuration}</span>
            </div>
          </div>
          <div className="flex items-center sm:items-end sm:flex-col gap-2 sm:gap-1 sm:text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">{completedLessons}/{allLessons.length} aulas</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <Progress value={progress} className="w-20 sm:w-32 h-2" />
              <span className="text-xs sm:text-sm font-medium text-primary">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden border-b border-border">
        <details className="group">
          <summary className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 cursor-pointer text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />Conteúdo do Curso
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="max-h-[50vh] overflow-y-auto border-t border-border">
            <CourseSidebar course={course} currentLessonId={currentLesson.id} onLessonSelect={handleLessonSelect} isAdmin={isAdmin && isAdminMode} />
          </div>
        </details>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        <div className="w-80 shrink-0 hidden lg:block">
          <CourseSidebar course={course} currentLessonId={currentLesson.id} onLessonSelect={handleLessonSelect} isAdmin={isAdmin && isAdminMode} />
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <VideoPlayer
            src={currentLesson.videoUrl || ""}
            poster={currentLesson.thumbnail}
            title={currentLesson.title}
            onEnded={handleVideoEnded}
            onPrevious={handlePrevious}
            onNext={handleNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">{currentLesson.title}</h2>
                <div className="flex items-center gap-3 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{currentLesson.duration}</span>
                  {currentLesson.completed && (
                    <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Concluída</span>
                  )}
                </div>
              </div>
              {!currentLesson.completed && (
                <Button variant="outline" size="sm" onClick={handleMarkComplete} disabled={updateProgress.isPending} className="w-full sm:w-auto touch-target">
                  {updateProgress.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Marcar como assistida
                </Button>
              )}
            </div>
            {currentLesson.description && (
              <RichContentRenderer content={currentLesson.description} />
            )}
            {hasNext && (
              <div className="pt-3 sm:pt-4 border-t border-border">
                <Button variant="gradient" onClick={handleNext} className="w-full sm:w-auto">
                  <span className="truncate">Próxima: {allLessons[currentIndex + 1].title}</span>
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180 shrink-0" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
