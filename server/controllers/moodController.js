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

    // Average mood by context
    const byContextResult = await pool.query(
      `SELECT context, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as count
       FROM mood_logs WHERE user_id = $1
       GROUP BY context ORDER BY avg_rating DESC`,
      [userId]
    );

    // Average mood by hour of day
    const byHourResult = await pool.query(
      `SELECT EXTRACT(HOUR FROM logged_at) as hour, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as count
       FROM mood_logs WHERE user_id = $1
       GROUP BY hour ORDER BY hour`,
      [userId]
    );

    // Mood after high-protein vs high-carb meals
    const postMealResult = await pool.query(
      `SELECT
         CASE
           WHEN ml.protein_g > ml.carbs_g THEN 'high_protein'
           WHEN ml.carbs_g > ml.protein_g THEN 'high_carb'
           ELSE 'balanced'
         END as meal_type,
         ROUND(AVG(m.rating), 1) as avg_rating,
         COUNT(*) as count
       FROM mood_logs m
       JOIN meal_logs ml ON m.meal_id = ml.id
       WHERE m.user_id = $1 AND m.context = 'post_meal'
       GROUP BY meal_type`,
      [userId]
    );

    // Average mood on fasting vs eating days
    const fastingMoodResult = await pool.query(
      `SELECT context, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as count
       FROM mood_logs WHERE user_id = $1 AND context IN ('fasting', 'post_meal')
       GROUP BY context`,
      [userId]
    );

    // Daily mood trend (last 14 days)
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

    // Build text insights
    const insights = [];
    const byContext = byContextResult.rows;
    const postMeal = postMealResult.rows;

    if (byContext.length > 1) {
      const best = byContext[0];
      const worst = byContext[byContext.length - 1];
      if (parseFloat(best.avg_rating) - parseFloat(worst.avg_rating) >= 0.5) {
        insights.push(`You feel best during "${best.context}" (avg ${best.avg_rating}/5) and lowest during "${worst.context}" (avg ${worst.avg_rating}/5).`);
      }
    }

    const highProtein = postMeal.find(r => r.meal_type === 'high_protein');
    const highCarb = postMeal.find(r => r.meal_type === 'high_carb');
    if (highProtein && highCarb) {
      const diff = parseFloat(highProtein.avg_rating) - parseFloat(highCarb.avg_rating);
      if (Math.abs(diff) >= 0.3) {
        const better = diff > 0 ? 'high-protein' : 'high-carb';
        insights.push(`You tend to feel better after ${better} meals.`);
      }
    }

    const bestHour = byHourResult.rows.reduce((best, r) => parseFloat(r.avg_rating) > parseFloat(best.avg_rating) ? r : best, byHourResult.rows[0]);
    if (bestHour) {
      const hourLabel = parseInt(bestHour.hour) >= 12 ? `${parseInt(bestHour.hour) - 12 || 12}PM` : `${parseInt(bestHour.hour) || 12}AM`;
      insights.push(`Your peak energy tends to be around ${hourLabel}.`);
    }

    res.json({
      insights,
      overallAvg: parseFloat(overallResult.rows[0].overall_avg),
      totalEntries,
      byContext: byContextResult.rows,
      byHour: byHourResult.rows,
      postMealCorrelation: postMealResult.rows,
      trend: trendResult.rows,
    });
  } catch (err) {
    console.error('getMoodInsights error:', err);
    res.status(500).json({ error: 'Failed to generate mood insights' });
  }
}
