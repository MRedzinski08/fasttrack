import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMeals, logMeal, deleteMeal } from '../controllers/mealsController.js';
import pool from '../db/index.js';

const router = Router();

router.use(requireAuth);
router.get('/', getMeals);
router.post('/', logMeal);
router.delete('/:id', deleteMeal);

// Get recent unique meals for Meal Replay
router.get('/recent', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `SELECT DISTINCT ON (food_name) food_name, calories, protein_g, carbs_g, fat_g, unit, MAX(eaten_at) as last_eaten
       FROM meal_logs WHERE user_id = $1 AND eaten_at >= NOW() - INTERVAL '14 days'
       GROUP BY food_name, calories, protein_g, carbs_g, fat_g, unit
       ORDER BY food_name, MAX(eaten_at) DESC
       LIMIT 10`,
      [userResult.rows[0].id]
    );
    res.json({ meals: result.rows });
  } catch (err) {
    console.error('getRecentMeals error:', err);
    res.status(500).json({ error: 'Failed to fetch recent meals' });
  }
});

export default router;
