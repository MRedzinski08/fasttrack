import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id, fasting_hours FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0];
}

export async function getCurrentFast(req, res) {
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NULL
       ORDER BY fast_start DESC LIMIT 1`,
      [user.id]
    );

    if (!result.rows[0]) {
      return res.json({ session: null, timeRemainingSeconds: 0 });
    }

    const session = result.rows[0];
    const now = Date.now();
    const fastStartMs = new Date(session.fast_start).getTime();
    const targetMs = session.target_hours * 60 * 60 * 1000;
    const elapsedMs = now - fastStartMs;
    const fastComplete = elapsedMs >= targetMs;

    // Check if we're in an eating window
    if (session.eating_window_start) {
      const ewStart = new Date(session.eating_window_start).getTime();
      const ewHours = session.eating_window_hours || 8;
      const ewTargetMs = ewHours * 60 * 60 * 1000;
      const ewElapsed = now - ewStart;

      if (ewElapsed < ewTargetMs) {
        // Still in eating window
        const ewRemaining = Math.max(0, Math.round((ewTargetMs - ewElapsed) / 1000));
        return res.json({ session, timeRemainingSeconds: ewRemaining, eatingWindowActive: true });
      } else {
        // Eating window expired — close this session and start new fast
        const ewEnd = new Date(ewStart + ewTargetMs);
        await pool.query(
          `UPDATE fasting_sessions SET fast_end = $1, completed = TRUE WHERE id = $2`,
          [ewEnd, session.id]
        );
        const newSession = await pool.query(
          `INSERT INTO fasting_sessions (user_id, fast_start, target_hours)
           VALUES ($1, $2, $3) RETURNING *`,
          [user.id, ewEnd, user.fasting_hours]
        );
        const ns = newSession.rows[0];
        const nsElapsed = now - new Date(ns.fast_start).getTime();
        const nsRemaining = Math.max(0, Math.round((ns.target_hours * 3600000 - nsElapsed) / 1000));
        return res.json({ session: ns, timeRemainingSeconds: nsRemaining, eatingWindowActive: false });
      }
    }

    // Not in eating window — regular fasting countdown
    const timeRemainingSeconds = Math.max(0, Math.round((targetMs - elapsedMs) / 1000));
    res.json({ session, timeRemainingSeconds, eatingWindowActive: false, fastComplete });
  } catch (err) {
    console.error('getCurrentFast error:', err);
    res.status(500).json({ error: 'Failed to fetch fasting session' });
  }
}

export async function startFast(req, res) {
  const { targetHours } = req.body;
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hours = targetHours || user.fasting_hours;

    // Close any active session first
    await pool.query(
      `UPDATE fasting_sessions SET fast_end = NOW(), broken_early = TRUE
       WHERE user_id = $1 AND fast_end IS NULL`,
      [user.id]
    );

    const result = await pool.query(
      `INSERT INTO fasting_sessions (user_id, fast_start, target_hours)
       VALUES ($1, NOW(), $2) RETURNING *`,
      [user.id, hours]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error('startFast error:', err);
    res.status(500).json({ error: 'Failed to start fasting session' });
  }
}

export async function breakFast(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await getUserId(req.user.uid);
    if (!user) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const activeResult = await client.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NULL
       ORDER BY fast_start DESC LIMIT 1 FOR UPDATE`,
      [user.id]
    );

    if (!activeResult.rows[0]) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'No active fasting session' });
    }

    const active = activeResult.rows[0];
    const elapsedHours = (Date.now() - new Date(active.fast_start).getTime()) / (1000 * 60 * 60);
    const completed = elapsedHours >= active.target_hours;

    const closed = await client.query(
      `UPDATE fasting_sessions SET
         fast_end = NOW(),
         completed = $1,
         broken_early = $2
       WHERE id = $3 RETURNING *`,
      [completed, !completed, active.id]
    );

    // Start a new session
    const newSession = await client.query(
      `INSERT INTO fasting_sessions (user_id, fast_start, target_hours)
       VALUES ($1, NOW(), $2) RETURNING *`,
      [user.id, active.target_hours]
    );

    await client.query('COMMIT');
    res.json({ closedSession: closed.rows[0], newSession: newSession.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('breakFast error:', err);
    res.status(500).json({ error: 'Failed to break fast' });
  } finally {
    client.release();
  }
}

export async function startEatingWindow(req, res) {
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get eating_hours from user profile
    const profileResult = await pool.query(
      'SELECT eating_hours FROM user_profiles WHERE id = $1',
      [user.id]
    );
    const eatingHours = profileResult.rows[0]?.eating_hours || 8;

    // Close any existing active session
    await pool.query(
      `UPDATE fasting_sessions SET fast_end = NOW(), broken_early = TRUE
       WHERE user_id = $1 AND fast_end IS NULL`,
      [user.id]
    );

    // Create a fresh session with eating window starting now
    const result = await pool.query(
      `INSERT INTO fasting_sessions (user_id, fast_start, target_hours, eating_window_start, eating_window_hours)
       VALUES ($1, NOW(), $2, NOW(), $3) RETURNING *`,
      [user.id, user.fasting_hours, eatingHours]
    );

    const ewRemaining = eatingHours * 3600;
    res.json({ session: result.rows[0], timeRemainingSeconds: ewRemaining, eatingWindowActive: true });
  } catch (err) {
    console.error('startEatingWindow error:', err);
    res.status(500).json({ error: 'Failed to start eating window' });
  }
}

export async function getFastingHistory(req, res) {
  const limit = parseInt(req.query.limit) || 30;
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NOT NULL
       ORDER BY fast_start DESC LIMIT $2`,
      [user.id, limit]
    );

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('getFastingHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch fasting history' });
  }
}
