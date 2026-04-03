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

export default router;
