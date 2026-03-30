import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { registerUser, getMe, updateProfile, calculateRecommendedCalories } from '../controllers/authController.js';

const router = Router();

router.post('/register', registerUser);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.post('/calculate-calories', requireAuth, calculateRecommendedCalories);

export default router;
