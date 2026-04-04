import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { suggestMeal } from '../controllers/mealBuilderController.js';

const router = Router();
router.post('/suggest', requireAuth, suggestMeal);
export default router;
