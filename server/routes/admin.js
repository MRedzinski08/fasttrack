import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Simple secret key check — not Firebase auth, just a shared secret
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, display_name, subscription_tier, subscription_status,
              daily_calorie_goal, fasting_protocol, current_weight, goal_weight,
              created_at
       FROM user_profiles ORDER BY created_at DESC`
    );
    res.json({ users: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [users, meals, sessions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM user_profiles'),
      pool.query('SELECT COUNT(*) FROM meal_logs'),
      pool.query('SELECT COUNT(*) FROM fasting_sessions'),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalMeals: parseInt(meals.rows[0].count),
      totalFastingSessions: parseInt(sessions.rows[0].count),
    });
  } catch (err) {
    console.error('admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// PUT /api/admin/users/:id/tier
router.put('/users/:id/tier', requireAdmin, async (req, res) => {
  const { tier } = req.body;
  if (!['free', 'pro'].includes(tier)) return res.status(400).json({ error: 'tier must be free or pro' });
  try {
    const result = await pool.query(
      `UPDATE user_profiles SET subscription_tier = $1, subscription_status = $2 WHERE id = $3 RETURNING id, email, display_name, subscription_tier`,
      [tier, tier === 'pro' ? 'active' : 'none', req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ updated: result.rows[0] });
  } catch (err) {
    console.error('admin/tier error:', err);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

export default router;
