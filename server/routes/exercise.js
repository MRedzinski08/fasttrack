import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getExercises, logExercise, getTodayExercises, deleteExercise } from '../controllers/exerciseController.js';

const router = Router();

router.get('/list', requireAuth, getExercises);
router.post('/', requireAuth, logExercise);
router.get('/today', requireAuth, getTodayExercises);
router.delete('/:id', requireAuth, deleteExercise);

export default router;
