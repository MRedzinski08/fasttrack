import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateGroceryList } from '../controllers/groceryController.js';

const router = Router();
router.post('/generate', requireAuth, generateGroceryList);
export default router;
