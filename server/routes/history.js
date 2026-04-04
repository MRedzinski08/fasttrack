import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCalorieTrend, getFastingAdherence } from '../controllers/historyController.js';
import pool from '../db/index.js';

const router = Router();

router.use(requireAuth);
router.get('/calories', getCalorieTrend);
router.get('/fasting', getFastingAdherence);

// Weekly report card
router.get('/weekly-report', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM user_profiles WHERE firebase_uid = $1', [req.user.uid]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    // Last 7 days of data
    const calorieResult = await pool.query(
      `SELECT DATE(eaten_at) as day, SUM(calories) as total_cal,
              SUM(protein_g) as total_protein, SUM(carbs_g) as total_carbs, SUM(fat_g) as total_fat,
              COUNT(*) as meal_count
       FROM meal_logs WHERE user_id = $1 AND eaten_at >= NOW() - INTERVAL '7 days'
       GROUP BY day ORDER BY day`,
      [user.id]
    );

    const fastingResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE completed = TRUE) as completed,
              COUNT(*) FILTER (WHERE broken_early = TRUE) as broken,
              COUNT(*) as total
       FROM fasting_sessions WHERE user_id = $1 AND fast_start >= NOW() - INTERVAL '7 days'`,
      [user.id]
    );

    const exerciseResult = await pool.query(
      `SELECT COUNT(*) as sessions, COALESCE(SUM(calories_burned), 0) as total_burned,
              COALESCE(SUM(duration_min), 0) as total_min
       FROM exercise_logs WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '7 days'`,
      [user.id]
    );

    const difficultyResult = await pool.query(
      `SELECT ROUND(AVG(fd.rating), 1) as avg_difficulty
       FROM fasting_difficulty fd
       JOIN fasting_sessions fs ON fd.session_id = fs.id
       WHERE fd.user_id = $1 AND fd.created_at >= NOW() - INTERVAL '7 days'`,
      [user.id]
    );

    const hydrationResult = await pool.query(
      `SELECT ROUND(AVG(glasses), 1) as avg_glasses
       FROM hydration_logs WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '7 days'`,
      [user.id]
    );

    const days = calorieResult.rows;
    const daysLogged = days.length;
    const avgCalories = daysLogged > 0 ? Math.round(days.reduce((s, d) => s + parseInt(d.total_cal), 0) / daysLogged) : 0;
    const avgProtein = daysLogged > 0 ? Math.round(days.reduce((s, d) => s + parseFloat(d.total_protein), 0) / daysLogged) : 0;
    const totalMeals = days.reduce((s, d) => s + parseInt(d.meal_count), 0);
    const goal = user.daily_calorie_goal || 2000;
    const calAccuracy = Math.round((1 - Math.abs(avgCalories - goal) / goal) * 100);

    const fasting = fastingResult.rows[0];
    const fastingAdherence = parseInt(fasting.total) > 0 ? Math.round((parseInt(fasting.completed) / parseInt(fasting.total)) * 100) : 0;

    const exercise = exerciseResult.rows[0];

    // Letter grade
    let score = 0;
    if (daysLogged >= 5) score += 25; else if (daysLogged >= 3) score += 15;
    if (calAccuracy >= 85) score += 25; else if (calAccuracy >= 70) score += 15;
    if (fastingAdherence >= 80) score += 25; else if (fastingAdherence >= 50) score += 15;
    if (parseInt(exercise.sessions) >= 3) score += 25; else if (parseInt(exercise.sessions) >= 1) score += 15;

    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    res.json({
      grade,
      score,
      daysLogged,
      avgCalories,
      avgProtein,
      calGoal: goal,
      calAccuracy,
      totalMeals,
      fasting: {
        completed: parseInt(fasting.completed),
        broken: parseInt(fasting.broken),
        total: parseInt(fasting.total),
        adherence: fastingAdherence,
      },
      exercise: {
        sessions: parseInt(exercise.sessions),
        totalBurned: parseInt(exercise.total_burned),
        totalMin: parseInt(exercise.total_min),
      },
      avgDifficulty: difficultyResult.rows[0]?.avg_difficulty ? parseFloat(difficultyResult.rows[0].avg_difficulty) : null,
      avgHydration: hydrationResult.rows[0]?.avg_glasses ? parseFloat(hydrationResult.rows[0].avg_glasses) : null,
      dailyBreakdown: days,
    });
  } catch (err) {
    console.error('weeklyReport error:', err);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

export default router;
