import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { chat, getDailySummary } from '../controllers/aiController.js';

const router = Router();

router.use(requireAuth);
router.post('/chat', chat);
router.get('/summary', getDailySummary);

export default router;
