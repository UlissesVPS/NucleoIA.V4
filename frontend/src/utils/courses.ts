import { Course, Lesson } from '@/types/course';

export const getAllLessons = (course: Course): Lesson[] => {
  return (course.modules || []).flatMap(module => module.lessons || []);
};

export const calculateProgress = (course: Course): number => {
  const lessons = getAllLessons(course);
  if (lessons.length === 0) return 0;
  const completed = lessons.filter(l => l.completed).length;
  return Math.round((completed / lessons.length) * 100);
};
