import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMealPrep, addMealPrep, deleteMealPrep, logPrepMeal } from '../controllers/mealPrepController.js';

const router = Router();

router.get('/', requireAuth, getMealPrep);
router.post('/', requireAuth, addMealPrep);
router.delete('/:id', requireAuth, deleteMealPrep);
router.post('/:id/log', requireAuth, logPrepMeal);

export default router;
