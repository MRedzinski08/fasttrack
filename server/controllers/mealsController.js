import pool from '../db/index.js';

async function getUser(firebaseUid) {
  const result = await pool.query(
    'SELECT id, fasting_hours, eating_hours FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0];
}

// Grace window in minutes — rapid meal logging won't open a new fasting session
const GRACE_WINDOW_MINUTES = 30;

export async function getMeals(req, res) {
  const { date, limit } = req.query;
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let query, params;
    if (date) {
      query = `SELECT * FROM meal_logs
               WHERE user_id = $1
                 AND eaten_at >= $2::date
                 AND eaten_at < $2::date + INTERVAL '1 day'
               ORDER BY eaten_at DESC`;
      params = [user.id, date];
    } else {
      query = `SELECT * FROM meal_logs
               WHERE user_id = $1
                 AND eaten_at >= CURRENT_DATE
                 AND eaten_at < CURRENT_DATE + INTERVAL '1 day'
               ORDER BY eaten_at DESC
               LIMIT $2`;
      params = [user.id, parseInt(limit) || 50];
    }

    const result = await pool.query(query, params);
    res.json({ meals: result.rows });
  } catch (err) {
    console.error('getMeals error:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
}

export async function logMeal(req, res) {
  const { foodName, calories, proteinG, carbsG, fatG, quantity, unit } = req.body;
  if (!foodName || calories == null) {
    return res.status(400).json({ error: 'foodName and calories are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await getUser(req.user.uid);
    if (!user) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();

    // Insert the meal
    const mealResult = await client.query(
      `INSERT INTO meal_logs (user_id, food_name, calories, protein_g, carbs_g, fat_g, quantity, unit, eaten_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.id, foodName, calories, proteinG || 0, carbsG || 0, fatG || 0, quantity || 1, unit || null, now]
    );
    const meal = mealResult.rows[0];

    // Fasting logic with eating window support
    const activeResult = await client.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NULL
       ORDER BY fast_start DESC LIMIT 1`,
      [user.id]
    );

    let fastingSession;
    let outsideEatingWindow = false;
    let eatingWindowActive = false;
    let eatingWindowRemaining = 0;

    if (activeResult.rows[0]) {
      const active = activeResult.rows[0];
      const elapsedMs = now - new Date(active.fast_start);
      const targetMs = active.target_hours * 60 * 60 * 1000;
      const fastingComplete = elapsedMs >= targetMs;

      if (active.eating_window_start) {
        // Already in eating window — check if it's still open
        const ewElapsed = now - new Date(active.eating_window_start);
        const ewTarget = (active.eating_window_hours || user.eating_hours) * 60 * 60 * 1000;

        if (ewElapsed < ewTarget) {
          // Still in eating window — meal is fine, no changes to session
          fastingSession = active;
          eatingWindowActive = true;
          eatingWindowRemaining = Math.max(0, Math.round((ewTarget - ewElapsed) / 1000));
        } else {
          // Eating window has expired — close this session, start new fast
          await client.query(
            `UPDATE fasting_sessions SET fast_end = $1, completed = TRUE
             WHERE id = $2`,
            [new Date(active.eating_window_start.getTime ? active.eating_window_start.getTime() + ewTarget : now), active.id]
          );

          // New fast starts from when eating window ended
          const fastStart = new Date(new Date(active.eating_window_start).getTime() + ewTarget);
          const newSession = await client.query(
            `INSERT INTO fasting_sessions (user_id, fast_start, target_hours)
             VALUES ($1, $2, $3) RETURNING *`,
            [user.id, fastStart, user.fasting_hours]
          );
          fastingSession = newSession.rows[0];
          // This meal is outside the eating window of the NEW session
          outsideEatingWindow = true;
        }
      } else if (fastingComplete) {
        // Fast is done, no eating window started yet — this is the FIRST meal
        // Start the eating window now
        await client.query(
          `UPDATE fasting_sessions SET eating_window_start = $1, eating_window_hours = $2
           WHERE id = $3`,
          [now, user.eating_hours, active.id]
        );
        fastingSession = { ...active, eating_window_start: now, eating_window_hours: user.eating_hours };
        eatingWindowActive = true;
        eatingWindowRemaining = user.eating_hours * 3600;
      } else {
        // Still fasting — meal is outside eating window
        outsideEatingWindow = true;
        fastingSession = active;
      }
    } else {
      // No active session — start an eating window first, then fasting begins after
      const newSession = await client.query(
        `INSERT INTO fasting_sessions (user_id, fast_start, target_hours, eating_window_start, eating_window_hours)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user.id, now, user.fasting_hours, now, user.eating_hours]
      );
      fastingSession = newSession.rows[0];
      eatingWindowActive = true;
      eatingWindowRemaining = user.eating_hours * 3600;
    }

    await client.query('COMMIT');

    // Calculate time remaining
    let timeRemainingSeconds;
    if (eatingWindowActive) {
      timeRemainingSeconds = eatingWindowRemaining;
    } else {
      const targetMs = fastingSession.target_hours * 60 * 60 * 1000;
      const elapsedMs = now - new Date(fastingSession.fast_start);
      timeRemainingSeconds = Math.max(0, Math.round((targetMs - elapsedMs) / 1000));
    }

    res.status(201).json({ meal, fastingSession, timeRemainingSeconds, outsideEatingWindow, eatingWindowActive });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('logMeal error:', err);
    res.status(500).json({ error: 'Failed to log meal' });
  } finally {
    client.release();
  }
}

export async function deleteMeal(req, res) {
  const { id } = req.params;
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      'DELETE FROM meal_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('deleteMeal error:', err);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
}
