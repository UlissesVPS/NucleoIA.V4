import { Router } from 'express';
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson, updateProgress
} from '../controllers/courses.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listCourses);
router.get('/:id', getCourse);

// Admin only
router.post('/', adminMiddleware, createCourse);
router.put('/:id', adminMiddleware, updateCourse);
router.delete('/:id', adminMiddleware, deleteCourse);

// Modules
router.post('/:id/modules', adminMiddleware, createModule);

export default router;

// Module routes
export const moduleRouter = Router();
moduleRouter.use(authMiddleware, adminMiddleware);
moduleRouter.put('/:id', updateModule);
moduleRouter.delete('/:id', deleteModule);
moduleRouter.post('/:id/lessons', createLesson);

// Lesson routes
export const lessonRouter = Router();
lessonRouter.use(authMiddleware);
lessonRouter.put('/:id', adminMiddleware, updateLesson);
lessonRouter.delete('/:id', adminMiddleware, deleteLesson);
lessonRouter.patch('/:id/progress', updateProgress);
