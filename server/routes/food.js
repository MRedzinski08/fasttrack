import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { searchFood } from '../controllers/foodController.js';
import pool from '../db/index.js';

const router = Router();

router.get('/search', requireAuth, searchFood);

// Saved foods
router.get('/saved', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      'SELECT * FROM saved_foods WHERE user_id = $1 ORDER BY created_at DESC',
      [userResult.rows[0].id]
    );
    res.json({ foods: result.rows });
  } catch (err) {
    console.error('getSavedFoods error:', err);
    res.status(500).json({ error: 'Failed to fetch saved foods' });
  }
});

router.post('/saved', requireAuth, async (req, res) => {
  const { foodName, calories, proteinG, carbsG, fatG } = req.body;
  if (!foodName || calories == null) return res.status(400).json({ error: 'foodName and calories required' });
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `INSERT INTO saved_foods (user_id, food_name, calories, protein_g, carbs_g, fat_g)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userResult.rows[0].id, foodName, calories, proteinG || 0, carbsG || 0, fatG || 0]
    );
    res.status(201).json({ food: result.rows[0] });
  } catch (err) {
    console.error('saveFood error:', err);
    res.status(500).json({ error: 'Failed to save food' });
  }
});

router.delete('/saved/:id', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    await pool.query('DELETE FROM saved_foods WHERE id = $1 AND user_id = $2', [req.params.id, userResult.rows[0].id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteSavedFood error:', err);
    res.status(500).json({ error: 'Failed to delete saved food' });
  }
});

export default router;
