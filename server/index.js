import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import mealsRoutes from './routes/meals.js';
import fastingRoutes from './routes/fasting.js';
import foodRoutes from './routes/food.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import historyRoutes from './routes/history.js';
import exerciseRoutes from './routes/exercise.js';
import billingRoutes from './routes/billing.js';
import mealPrepRoutes from './routes/mealPrep.js';
import photoRoutes from './routes/photo.js';
import barcodeRoutes from './routes/barcode.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/fasting', fastingRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/meal-prep', mealPrepRoutes);
app.use('/api/photo', photoRoutes);
app.use('/api/barcode', barcodeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`FastTrack server running on http://localhost:${PORT}`);
});
