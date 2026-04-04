import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0]?.id;
}

// Log a mood/energy rating
export async function logMood(req, res) {
  const { rating, context, mealId, note } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating (1-5) is required' });
  }

  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Check if already logged today
    const existing = await pool.query(
      `SELECT id FROM mood_logs WHERE user_id = $1 AND logged_at >= CURRENT_DATE AND logged_at < CURRENT_DATE + INTERVAL '1 day'`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already logged energy today. Come back tomorrow.' });
    }

    const result = await pool.query(
      `INSERT INTO mood_logs (user_id, rating, context, meal_id, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, rating, context || 'general', mealId || null, note || null]
    );

    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    console.error('logMood error:', err);
    res.status(500).json({ error: 'Failed to log mood' });
  }
}

// Get mood history
export async function getMoodHistory(req, res) {
  const { days } = req.query;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT m.*, ml.food_name, ml.calories
       FROM mood_logs m
       LEFT JOIN meal_logs ml ON m.meal_id = ml.id
       WHERE m.user_id = $1 AND m.logged_at >= NOW() - ($2::integer || ' days')::interval
       ORDER BY m.logged_at DESC`,
      [userId, parseInt(days) || 14]
    );

    res.json({ moods: result.rows });
  } catch (err) {
    console.error('getMoodHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
}

// Get mood insights — correlate mood with food/fasting patterns
export async function getMoodInsights(req, res) {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Need at least 7 entries for meaningful insights
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM mood_logs WHERE user_id = $1',
      [userId]
    );
    const totalEntries = parseInt(countResult.rows[0].count);

    if (totalEntries < 7) {
      return res.json({
        insights: null,
        message: `Log ${7 - totalEntries} more mood entries to unlock insights.`,
        totalEntries,
        needed: 7,
      });
    }

    // Correlate mood with same-day meals (macro breakdown)
    const mealCorrelationResult = await pool.query(
      `SELECT
         m.rating,
         COALESCE(SUM(ml.calories), 0) as day_calories,
         COALESCE(SUM(ml.protein_g), 0) as day_protein,
         COALESCE(SUM(ml.carbs_g), 0) as day_carbs,
         COALESCE(SUM(ml.fat_g), 0) as day_fat
       FROM mood_logs m
       LEFT JOIN meal_logs ml ON ml.user_id = m.user_id
         AND DATE(ml.eaten_at) = DATE(m.logged_at)
       WHERE m.user_id = $1
       GROUP BY m.id, m.rating, DATE(m.logged_at)
       ORDER BY m.logged_at DESC`,
      [userId]
    );

    // Avg mood on high-protein vs high-carb vs high-fat days
    const dayMacros = mealCorrelationResult.rows.filter(r => parseFloat(r.day_calories) > 0);
    const macroCorrelation = {};
    for (const row of dayMacros) {
      const p = parseFloat(row.day_protein);
      const c = parseFloat(row.day_carbs);
      const f = parseFloat(row.day_fat);
      let dominant = 'balanced';
      if (p > c && p > f) dominant = 'high_protein';
      else if (c > p && c > f) dominant = 'high_carb';
      else if (f > p && f > c) dominant = 'high_fat';
      if (!macroCorrelation[dominant]) macroCorrelation[dominant] = { total: 0, count: 0 };
      macroCorrelation[dominant].total += row.rating;
      macroCorrelation[dominant].count += 1;
    }
    const macroInsights = Object.entries(macroCorrelation).map(([type, data]) => ({
      meal_type: type,
      avg_rating: (data.total / data.count).toFixed(1),
      count: data.count,
    }));

    // Avg mood by calorie level (under/at/over goal)
    const calorieCorrelation = await pool.query(
      `SELECT
         CASE
           WHEN COALESCE(day_cal, 0) < up.daily_calorie_goal * 0.8 THEN 'under'
           WHEN COALESCE(day_cal, 0) > up.daily_calorie_goal * 1.1 THEN 'over'
           ELSE 'on_target'
         END as cal_level,
         ROUND(AVG(m.rating), 1) as avg_rating,
         COUNT(*) as count
       FROM mood_logs m
       JOIN user_profiles up ON up.id = m.user_id
       LEFT JOIN LATERAL (
         SELECT SUM(calories) as day_cal
         FROM meal_logs ml
         WHERE ml.user_id = m.user_id AND DATE(ml.eaten_at) = DATE(m.logged_at)
       ) dc ON TRUE
       WHERE m.user_id = $1
       GROUP BY cal_level`,
      [userId]
    );

    // Daily trend
    const trendResult = await pool.query(
      `SELECT DATE(logged_at) as day, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as entries
       FROM mood_logs WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '14 days'
       GROUP BY day ORDER BY day`,
      [userId]
    );

    // Overall average
    const overallResult = await pool.query(
      'SELECT ROUND(AVG(rating), 1) as overall_avg FROM mood_logs WHERE user_id = $1',
      [userId]
    );

    // Most common foods on high-energy vs low-energy days
    const highEnergyFoods = await pool.query(
      `SELECT ml.food_name, COUNT(*) as freq
       FROM mood_logs m
       JOIN meal_logs ml ON ml.user_id = m.user_id AND DATE(ml.eaten_at) = DATE(m.logged_at)
       WHERE m.user_id = $1 AND m.rating >= 4
       GROUP BY ml.food_name ORDER BY freq DESC LIMIT 3`,
      [userId]
    );

    const lowEnergyFoods = await pool.query(
      `SELECT ml.food_name, COUNT(*) as freq
       FROM mood_logs m
       JOIN meal_logs ml ON ml.user_id = m.user_id AND DATE(ml.eaten_at) = DATE(m.logged_at)
       WHERE m.user_id = $1 AND m.rating <= 2
       GROUP BY ml.food_name ORDER BY freq DESC LIMIT 3`,
      [userId]
    );

    // Build text insights
    const insights = [];

    // Macro correlation insight
    const sorted = macroInsights.sort((a, b) => parseFloat(b.avg_rating) - parseFloat(a.avg_rating));
    if (sorted.length >= 2) {
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (parseFloat(best.avg_rating) - parseFloat(worst.avg_rating) >= 0.3) {
        const labels = { high_protein: 'high-protein', high_carb: 'high-carb', high_fat: 'high-fat', balanced: 'balanced' };
        insights.push(`You tend to feel better on ${labels[best.meal_type]} days (avg ${best.avg_rating}/5) vs ${labels[worst.meal_type]} days (avg ${worst.avg_rating}/5).`);
      }
    }

    // Calorie level insight
    const calLevels = calorieCorrelation.rows;
    const onTarget = calLevels.find(r => r.cal_level === 'on_target');
    const under = calLevels.find(r => r.cal_level === 'under');
    if (onTarget && under && parseFloat(onTarget.avg_rating) - parseFloat(under.avg_rating) >= 0.3) {
      insights.push(`Your energy is higher when you hit your calorie goal (${onTarget.avg_rating}/5) vs undereating (${under.avg_rating}/5).`);
    }

    // Food correlation insight
    if (highEnergyFoods.rows.length > 0) {
      const foods = highEnergyFoods.rows.map(r => r.food_name).join(', ');
      insights.push(`Foods you eat on high-energy days: ${foods}.`);
    }
    if (lowEnergyFoods.rows.length > 0) {
      const foods = lowEnergyFoods.rows.map(r => r.food_name).join(', ');
      insights.push(`Foods common on low-energy days: ${foods}.`);
    }

    res.json({
      insights,
      overallAvg: parseFloat(overallResult.rows[0].overall_avg),
      totalEntries,
      macroCorrelation: macroInsights,
      calorieCorrelation: calLevels,
      trend: trendResult.rows,
    });
  } catch (err) {
    console.error('getMoodInsights error:', err);
    res.status(500).json({ error: 'Failed to generate mood insights' });
  }
}
