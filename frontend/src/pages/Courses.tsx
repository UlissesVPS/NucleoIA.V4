import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GraduationCap, Play, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionButton, DeleteConfirmDialog } from "@/components/admin";
import CourseFormDrawer from "@/components/admin/CourseFormDrawer";
import CourseCard from "@/components/courses/CourseCard";
import HeroBanner from "@/components/courses/HeroBanner";
import CourseCarousel from "@/components/courses/CourseCarousel";
import NetflixCourseCard from "@/components/courses/NetflixCourseCard";
import LessonCard from "@/components/courses/LessonCard";
import GlassCard from "@/components/GlassCard";
import BannerSettings from "@/components/admin/BannerSettings";
import Badge from "@/components/Badge";
import { toast } from "sonner";
import { useCourses, useCourse, useCreateCourse, useUpdateCourse, useDeleteCourse, usePageSettings } from "@/hooks/useApi";
import { getAllLessons } from "@/utils/courses";
import type { Course, Lesson } from "@/types";

const Courses = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // API hooks
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const { data: aulasSettings } = usePageSettings('aulas');

  
  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const { data: editingCourseDetail } = useCourse(editingCourseId || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);


  // Computed data for Netflix view
  const { featuredCourses, continueWatching, completedCourses } = useMemo(() => {
    const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);

    const completed = courses.filter((c) => c.progress === 100);

    const featured = inProgress.length > 0
      ? inProgress
      : courses.slice(0, 1);

    const lessonsInProgress: (Lesson & { courseId: string | number; courseName: string; moduleTitle: string; progressPercent: number })[] = [];
    
    inProgress.forEach((course) => {
      const allLessons = getAllLessons(course);
      const currentIndex = allLessons.findIndex((l) => !l.completed);
      if (currentIndex >= 0) {
        const lesson = allLessons[currentIndex];
        if (lesson) {
          lessonsInProgress.push({
            ...lesson,
            courseId: course.id,
            courseName: course.title,
            moduleTitle: '',
            progressPercent: lesson.progressPct || 0,
          });
        }
      }
    });

    return {
      featuredCourses: featured,
      continueWatching: lessonsInProgress,
      completedCourses: completed,
    };
  }, [courses]);

  const handleCourseClick = (course: Course) => {
    navigate(`/aulas/${course.id}`);
  };

  const handlePlayCourse = (course: Course) => {
    navigate(`/aulas/${course.id}?autoplay=true`);
  };

  const handleLessonClick = (lesson: Lesson & { courseId: string | number }) => {
    navigate(`/aulas/${lesson.courseId}?lesson=${lesson.id}&autoplay=true`);
  };

  const handleAddCourse = () => {
    setEditingCourseId(null);
    setFormOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseId(String(course.id));
    setFormOpen(true);
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (courseToDelete) {
      try {
        await deleteCourse.mutateAsync(String(courseToDelete.id));
        toast.success(`"${courseToDelete.title}" foi excluído`);
      } catch {
        toast.error("Erro ao excluir curso");
      }
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleFormSubmit = async (courseData: Partial<Course>) => {
    try {
      if (courseData.id) {
        await updateCourse.mutateAsync({ id: String(courseData.id), ...courseData } as any);
        toast.success(`"${courseData.title}" foi atualizado`);
      } else {
        await createCourse.mutateAsync(courseData as any);
        toast.success(`"${courseData.title}" foi criado`);
      }
    } catch {
      toast.error("Erro ao salvar curso");
    }
  };

  const totalLessons = courses.reduce((acc, c) => acc + (c.totalLessons || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin View
  if (isAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
        <GlassCard className="border border-border">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Badge variant="success" className="flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs sm:text-sm">Cursos</span>
            </Badge>
            <span className="text-muted-foreground hidden xs:inline">•</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{courses.length} cursos • {totalLessons} aulas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Modulos e Aulas</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Gerencie modulos e aulas completos sobre IA generativa.
          </p>
        </GlassCard>

        <BannerSettings />

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => handleCourseClick(course)}
              isAdmin={isAdmin}
              onEdit={() => handleEditCourse(course)}
              onDelete={() => handleDeleteClick(course)}
            />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Nenhum curso disponível</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Comece criando o primeiro curso.
            </p>
            <Button variant="gradient" onClick={handleAddCourse} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Curso
            </Button>
          </div>
        )}

        {courses.length > 0 && (
          <FloatingActionButton onClick={handleAddCourse} label="Novo Curso" />
        )}

        <CourseFormDrawer
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) setEditingCourseId(null); }}
          course={editingCourseId ? (editingCourseDetail || courses.find(c => String(c.id) === editingCourseId) || null) : null}
          onSubmit={handleFormSubmit}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Excluir Curso"
          itemName={courseToDelete?.title}
        />
      </div>
    );
  }

  // Member View - Netflix Style
  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in -mx-3 sm:-mx-4 md:-mx-6 -mt-4 sm:-mt-6">
      <div className="px-3 sm:px-4 md:px-6">
        <HeroBanner
          courses={featuredCourses}
          onContinue={handlePlayCourse}
          onDetails={handleCourseClick}
          customBanner={aulasSettings?.coverImageUrl ? {
            imageUrl: aulasSettings.coverImageUrl,
            title: aulasSettings.bannerTitle,
            subtitle: aulasSettings.bannerSubtitle,
          } : undefined}
        />
      </div>

      {continueWatching.length > 0 && (
        <div className="px-3 sm:px-4 md:px-6">
          <CourseCarousel
            title="Continuar Assistindo"
            icon={<Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          >
            {continueWatching.map((lesson) => (
              <LessonCard
                key={`${lesson.courseId}-${lesson.id}`}
                lesson={lesson}
                course={courses.find((c) => c.id === lesson.courseId)!}
                onClick={() => handleLessonClick(lesson as any)}
                progressPercent={lesson.progressPercent}
              />
            ))}
          </CourseCarousel>
        </div>
      )}

      <div className="px-3 sm:px-4 md:px-6">
        <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-foreground mb-4">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Todos os Cursos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {courses.map((course) => (
            <NetflixCourseCard
              key={course.id}
              course={course}
              onClick={() => handleCourseClick(course)}
              onPlay={() => handlePlayCourse(course)}
            />
          ))}
        </div>
      </div>

      {completedCourses.length > 0 && (
        <div className="px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
          <CourseCarousel
            title="Concluídos"
            icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />}
          >
            {completedCourses.map((course) => (
              <NetflixCourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course)}
                onPlay={() => handlePlayCourse(course)}
              />
            ))}
          </CourseCarousel>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-12 sm:py-16 px-3 sm:px-6">
          <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Nenhum curso disponível</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Em breve novos cursos serão adicionados.
          </p>
        </div>
      )}
    </div>
  );
};

export default Courses;
