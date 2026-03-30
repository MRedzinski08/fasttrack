import pool from '../db/index.js';

export async function getDashboardSummary(req, res) {
  try {
    const userResult = await pool.query(
      'SELECT * FROM user_profiles WHERE firebase_uid = $1',
      [req.user.uid]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Today's meals
    const mealsResult = await pool.query(
      `SELECT * FROM meal_logs
       WHERE user_id = $1
         AND eaten_at >= CURRENT_DATE
         AND eaten_at < CURRENT_DATE + INTERVAL '1 day'
       ORDER BY eaten_at DESC`,
      [user.id]
    );
    const todayMeals = mealsResult.rows;

    const calorieTotal = todayMeals.reduce((s, m) => s + m.calories, 0);
    const protein = todayMeals.reduce((s, m) => s + parseFloat(m.protein_g || 0), 0);
    const carbs = todayMeals.reduce((s, m) => s + parseFloat(m.carbs_g || 0), 0);
    const fat = todayMeals.reduce((s, m) => s + parseFloat(m.fat_g || 0), 0);

    // Active fast
    const fastResult = await pool.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NULL
       ORDER BY fast_start DESC LIMIT 1`,
      [user.id]
    );
    const activeFast = fastResult.rows[0] || null;
    let timeRemainingSeconds = 0;
    if (activeFast) {
      const targetMs = activeFast.target_hours * 60 * 60 * 1000;
      const elapsedMs = Date.now() - new Date(activeFast.fast_start).getTime();
      timeRemainingSeconds = Math.max(0, Math.round((targetMs - elapsedMs) / 1000));
    }

    // Streak
    const streakResult = await pool.query(
      `SELECT COUNT(*) FROM fasting_sessions
       WHERE user_id = $1 AND completed = TRUE
         AND fast_start >= NOW() - INTERVAL '30 days'`,
      [user.id]
    );
    const streak = parseInt(streakResult.rows[0].count);

    // AI Summary (return cached if available)
    const today = new Date().toISOString().split('T')[0];
    const aiSummary =
      user.ai_summary_date && String(user.ai_summary_date).startsWith(today)
        ? user.ai_summary_text
        : null;

    res.json({
      user: {
        displayName: user.display_name,
        dailyCalorieGoal: user.daily_calorie_goal,
        fastingProtocol: user.fasting_protocol,
        fastingHours: user.fasting_hours,
      },
      todayMeals: todayMeals.slice(0, 5),
      calorieTotal,
      macros: {
        protein: parseFloat(protein.toFixed(1)),
        carbs: parseFloat(carbs.toFixed(1)),
        fat: parseFloat(fat.toFixed(1)),
      },
      activeFast,
      timeRemainingSeconds,
      streak,
      aiSummary,
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}
