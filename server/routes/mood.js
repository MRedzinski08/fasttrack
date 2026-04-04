import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { logMood, getMoodHistory, getMoodInsights } from '../controllers/moodController.js';

const router = Router();
router.post('/', requireAuth, logMood);
router.get('/history', requireAuth, getMoodHistory);
router.get('/insights', requireAuth, getMoodInsights);
export default router;
