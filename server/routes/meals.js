import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMeals, logMeal, deleteMeal } from '../controllers/mealsController.js';

const router = Router();

router.use(requireAuth);
router.get('/', getMeals);
router.post('/', logMeal);
router.delete('/:id', deleteMeal);

export default router;
