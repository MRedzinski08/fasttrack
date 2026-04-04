import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import pool from '../db/index.js';

const router = Router();

async function getUserId(uid) {
  const r = await pool.query('SELECT id FROM user_profiles WHERE firebase_uid = $1', [uid]);
  return r.rows[0]?.id;
}

// GET today's hydration
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      'SELECT glasses FROM hydration_logs WHERE user_id = $1 AND logged_at = CURRENT_DATE',
      [userId]
    );
    res.json({ glasses: result.rows[0]?.glasses || 0 });
  } catch (err) {
    console.error('getHydration error:', err);
    res.status(500).json({ error: 'Failed to fetch hydration' });
  }
});

// POST add a glass
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `INSERT INTO hydration_logs (user_id, glasses, logged_at)
       VALUES ($1, 1, CURRENT_DATE)
       ON CONFLICT (user_id, logged_at) DO UPDATE SET glasses = hydration_logs.glasses + 1
       RETURNING glasses`,
      [userId]
    );
    res.json({ glasses: result.rows[0].glasses });
  } catch (err) {
    console.error('logHydration error:', err);
    res.status(500).json({ error: 'Failed to log hydration' });
  }
});

// DELETE remove a glass
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const result = await pool.query(
      `UPDATE hydration_logs SET glasses = GREATEST(0, glasses - 1)
       WHERE user_id = $1 AND logged_at = CURRENT_DATE
       RETURNING glasses`,
      [userId]
    );
    res.json({ glasses: result.rows[0]?.glasses || 0 });
  } catch (err) {
    console.error('removeHydration error:', err);
    res.status(500).json({ error: 'Failed to update hydration' });
  }
});

export default router;
