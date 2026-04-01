import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createCheckout, getSubscriptionStatus, handleCheckoutSuccess, cancelSubscription } from '../controllers/billingController.js';

const router = Router();

router.post('/checkout', requireAuth, createCheckout);
router.get('/status', requireAuth, getSubscriptionStatus);
router.post('/checkout-success', requireAuth, handleCheckoutSuccess);
router.post('/cancel', requireAuth, cancelSubscription);

export default router;
