import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCalorieTrend, getFastingAdherence } from '../controllers/historyController.js';

const router = Router();

router.use(requireAuth);
router.get('/calories', getCalorieTrend);
router.get('/fasting', getFastingAdherence);

export default router;
