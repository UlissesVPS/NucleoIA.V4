export interface Lesson {
  id: string | number;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration: string;
  durationSeconds: number;
  completed: boolean;
  order: number;
  progressPct?: number;
}

export interface Module {
  id: string | number;
  title: string;
  description?: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string | number;
  title: string;
  description: string;
  thumbnail: string;
  modules?: Module[];
  modulesCount?: number;
  totalLessons: number;
  totalDuration: string;
  progress: number;
  createdAt: string;
  isNew?: boolean;
  isPublished?: boolean;
  order?: number;
}
