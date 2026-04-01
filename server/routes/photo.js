import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { analyzePhoto } from '../controllers/photoController.js';

const router = Router();

router.post('/analyze', requireAuth, analyzePhoto);

export default router;
