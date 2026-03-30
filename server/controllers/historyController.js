import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0]?.id;
}

export async function getCalorieTrend(req, res) {
  const days = parseInt(req.query.days) || 7;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT
         DATE(eaten_at) AS date,
         SUM(calories)::integer AS total_calories
       FROM meal_logs
       WHERE user_id = $1
         AND eaten_at >= CURRENT_DATE - INTERVAL '1 day' * $2
       GROUP BY DATE(eaten_at)
       ORDER BY date ASC`,
      [userId, days]
    );

    res.json({ trend: result.rows });
  } catch (err) {
    console.error('getCalorieTrend error:', err);
    res.status(500).json({ error: 'Failed to fetch calorie trend' });
  }
}

export async function getFastingAdherence(req, res) {
  const days = parseInt(req.query.days) || 30;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE completed = TRUE) AS completed_count,
         MAX(EXTRACT(EPOCH FROM (fast_end - fast_start)) / 3600) AS longest_fast_hours
       FROM fasting_sessions
       WHERE user_id = $1
         AND fast_end IS NOT NULL
         AND fast_start >= CURRENT_DATE - INTERVAL '1 day' * $2`,
      [userId, days]
    );

    const row = result.rows[0];
    const total = parseInt(row.total);
    const completed = parseInt(row.completed_count);
    const adherencePercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sessionsResult = await pool.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NOT NULL
       ORDER BY fast_start DESC LIMIT $2`,
      [userId, days]
    );

    res.json({
      adherencePercent,
      totalSessions: total,
      completedSessions: completed,
      longestFastHours: parseFloat(row.longest_fast_hours || 0).toFixed(1),
      sessions: sessionsResult.rows,
    });
  } catch (err) {
    console.error('getFastingAdherence error:', err);
    res.status(500).json({ error: 'Failed to fetch fasting adherence' });
  }
}
