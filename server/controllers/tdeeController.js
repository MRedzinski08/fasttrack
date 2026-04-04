import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0]?.id;
}

// Log a weight entry
export async function logWeight(req, res) {
  const { weight } = req.body;
  if (!weight) return res.status(400).json({ error: 'weight is required' });

  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Upsert — one weight per day
    const result = await pool.query(
      `INSERT INTO weight_logs (user_id, weight_lbs, logged_at)
       VALUES ($1, $2, CURRENT_DATE)
       ON CONFLICT (user_id, logged_at) DO UPDATE SET weight_lbs = $2
       RETURNING *`,
      [userId, weight]
    );

    // Also update current_weight in user profile
    await pool.query(
      'UPDATE user_profiles SET current_weight = $1 WHERE id = $2',
      [weight, userId]
    );

    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('logWeight error:', err);
    res.status(500).json({ error: 'Failed to log weight' });
  }
}

// Get weight history
export async function getWeightHistory(req, res) {
  const { days } = req.query;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT weight_lbs, logged_at FROM weight_logs
       WHERE user_id = $1 AND logged_at >= CURRENT_DATE - $2::integer
       ORDER BY logged_at ASC`,
      [userId, parseInt(days) || 30]
    );

    res.json({ weights: result.rows });
  } catch (err) {
    console.error('getWeightHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch weight history' });
  }
}

// Calculate Adaptive TDEE
export async function calculateTDEE(req, res) {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Get last 2 weeks of weight data
    const weightResult = await pool.query(
      `SELECT weight_lbs, logged_at FROM weight_logs
       WHERE user_id = $1 AND logged_at >= CURRENT_DATE - 14
       ORDER BY logged_at ASC`,
      [userId]
    );

    if (weightResult.rows.length < 3) {
      return res.json({
        tdee: null,
        message: 'Need at least 3 weight entries over 2 weeks to calculate TDEE. Keep logging daily.',
        dataPoints: weightResult.rows.length,
        needed: 3,
      });
    }

    // Get average daily calorie intake over same period
    const intakeResult = await pool.query(
      `SELECT DATE(eaten_at) as day, SUM(calories) as daily_cal
       FROM meal_logs
       WHERE user_id = $1 AND eaten_at >= CURRENT_DATE - 14
       GROUP BY DATE(eaten_at)
       ORDER BY day`,
      [userId]
    );

    if (intakeResult.rows.length < 3) {
      return res.json({
        tdee: null,
        message: 'Need at least 3 days of meal data to calculate TDEE. Keep logging meals.',
        dataPoints: intakeResult.rows.length,
        needed: 3,
      });
    }

    const avgIntake = Math.round(
      intakeResult.rows.reduce((s, r) => s + parseInt(r.daily_cal), 0) / intakeResult.rows.length
    );

    // Weight change calculation
    const weights = weightResult.rows;
    const firstWeight = parseFloat(weights[0].weight_lbs);
    const lastWeight = parseFloat(weights[weights.length - 1].weight_lbs);
    const weightChange = lastWeight - firstWeight; // lbs
    const daySpan = Math.max(1, Math.round((new Date(weights[weights.length - 1].logged_at) - new Date(weights[0].logged_at)) / 86400000));

    // 1 lb of body weight ≈ 3500 calories
    const dailyCalorieBalance = (weightChange * 3500) / daySpan;
    const estimatedTDEE = Math.round(avgIntake - dailyCalorieBalance);

    // Save to tdee_logs
    const weekStart = weights[0].logged_at;
    await pool.query(
      `INSERT INTO tdee_logs (user_id, week_start, avg_intake, weight_start, weight_end, estimated_tdee)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, weekStart, avgIntake, firstWeight, lastWeight, estimatedTDEE]
    );

    // Suggest new calorie goal based on goal weight
    const userResult = await pool.query('SELECT goal_weight, daily_calorie_goal, current_weight FROM user_profiles WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    let suggestion = null;

    if (user.goal_weight && lastWeight > parseFloat(user.goal_weight)) {
      // Trying to lose weight — suggest deficit
      const weeklyLossTarget = 1.0; // lb per week
      const dailyDeficit = Math.round((weeklyLossTarget * 3500) / 7);
      const suggestedGoal = estimatedTDEE - dailyDeficit;
      suggestion = {
        currentGoal: user.daily_calorie_goal,
        suggestedGoal: Math.max(1200, suggestedGoal), // never below 1200
        reason: `Based on your real TDEE of ${estimatedTDEE} cal, a ${dailyDeficit} cal/day deficit targets ~${weeklyLossTarget} lb/week loss.`,
      };
    } else if (user.goal_weight && lastWeight < parseFloat(user.goal_weight)) {
      // Trying to gain weight
      const suggestedGoal = estimatedTDEE + 300;
      suggestion = {
        currentGoal: user.daily_calorie_goal,
        suggestedGoal,
        reason: `Based on your real TDEE of ${estimatedTDEE} cal, eating ${suggestedGoal} cal/day should support gradual weight gain.`,
      };
    }

    // Get TDEE history
    const historyResult = await pool.query(
      `SELECT week_start, estimated_tdee, avg_intake, weight_start, weight_end
       FROM tdee_logs WHERE user_id = $1 ORDER BY week_start DESC LIMIT 8`,
      [userId]
    );

    res.json({
      tdee: estimatedTDEE,
      avgIntake,
      weightChange: Math.round(weightChange * 10) / 10,
      daySpan,
      currentWeight: lastWeight,
      suggestion,
      history: historyResult.rows,
    });
  } catch (err) {
    console.error('calculateTDEE error:', err);
    res.status(500).json({ error: 'Failed to calculate TDEE' });
  }
}
