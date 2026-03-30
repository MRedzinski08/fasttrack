import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { searchFood } from '../controllers/foodController.js';

const router = Router();

router.get('/search', requireAuth, searchFood);

export default router;
