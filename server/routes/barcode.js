import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { lookupBarcode } from '../controllers/barcodeController.js';

const router = Router();

router.get('/lookup', requireAuth, lookupBarcode);

export default router;
