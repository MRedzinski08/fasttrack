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

// PUT /api/admin/users/:id/profile
router.put('/users/:id/profile', requireAdmin, async (req, res) => {
  const { displayName } = req.body;
  try {
    const result = await pool.query(
      'UPDATE user_profiles SET display_name = COALESCE($1, display_name) WHERE id = $2 RETURNING id, email, display_name',
      [displayName, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ updated: result.rows[0] });
  } catch (err) {
    console.error('admin/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
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

// POST /api/admin/migrate — run pending migrations
router.post('/migrate', requireAdmin, async (req, res) => {
  try {
    const results = [];
    const migrations = [
      `CREATE TABLE IF NOT EXISTS saved_foods (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE, food_name VARCHAR(255) NOT NULL, calories INTEGER NOT NULL, protein_g DECIMAL(6,1) DEFAULT 0, carbs_g DECIMAL(6,1) DEFAULT 0, fat_g DECIMAL(6,1) DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS weight_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE, weight_lbs DECIMAL(5,1) NOT NULL, logged_at DATE DEFAULT CURRENT_DATE, created_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, logged_at))`,
      `CREATE TABLE IF NOT EXISTS mood_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), context VARCHAR(20) DEFAULT 'general', meal_id INTEGER REFERENCES meal_logs(id) ON DELETE SET NULL, note TEXT, logged_at TIMESTAMP DEFAULT NOW(), created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS tdee_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE, week_start DATE NOT NULL, avg_intake INTEGER, weight_start DECIMAL(5,1), weight_end DECIMAL(5,1), estimated_tdee INTEGER, created_at TIMESTAMP DEFAULT NOW())`,
    ];
    for (const sql of migrations) {
      await pool.query(sql);
      results.push('OK');
    }
    res.json({ migrated: results.length, results });
  } catch (err) {
    console.error('migrate error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
