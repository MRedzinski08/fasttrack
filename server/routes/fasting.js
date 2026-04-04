import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCurrentFast, startFast, breakFast, startEatingWindow, getFastingHistory } from '../controllers/fastingController.js';
import pool from '../db/index.js';

const router = Router();

router.use(requireAuth);
router.get('/current', getCurrentFast);
router.post('/start', startFast);
router.post('/break', breakFast);
router.post('/start-eating', startEatingWindow);
router.get('/history', getFastingHistory);

// Rate fasting difficulty
router.post('/difficulty', async (req, res) => {
  const { sessionId, rating } = req.body;
  if (!sessionId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'sessionId and rating (1-5) required' });
  }
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `INSERT INTO fasting_difficulty (user_id, session_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) DO UPDATE SET rating = $3
       RETURNING *`,
      [userResult.rows[0].id, sessionId, rating]
    );
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('logDifficulty error:', err);
    res.status(500).json({ error: 'Failed to log difficulty' });
  }
});

// Get difficulty history
router.get('/difficulty', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `SELECT fd.rating, fd.created_at, fs.fast_start, fs.target_hours
       FROM fasting_difficulty fd
       JOIN fasting_sessions fs ON fd.session_id = fs.id
       WHERE fd.user_id = $1 ORDER BY fd.created_at DESC LIMIT 14`,
      [userResult.rows[0].id]
    );
    res.json({ ratings: result.rows });
  } catch (err) {
    console.error('getDifficulty error:', err);
    res.status(500).json({ error: 'Failed to fetch difficulty' });
  }
});

export default router;
