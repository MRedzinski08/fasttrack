import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { logWeight, getWeightHistory, calculateTDEE } from '../controllers/tdeeController.js';

const router = Router();
router.post('/weight', requireAuth, logWeight);
router.get('/weight', requireAuth, getWeightHistory);
router.get('/calculate', requireAuth, calculateTDEE);
export default router;
