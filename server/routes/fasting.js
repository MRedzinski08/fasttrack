import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCurrentFast, startFast, breakFast, getFastingHistory } from '../controllers/fastingController.js';

const router = Router();

router.use(requireAuth);
router.get('/current', getCurrentFast);
router.post('/start', startFast);
router.post('/break', breakFast);
router.get('/history', getFastingHistory);

export default router;
