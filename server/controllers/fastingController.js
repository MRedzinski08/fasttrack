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
    const fastStartMs = new Date(session.fast_start).getTime();
    const targetMs = session.target_hours * 60 * 60 * 1000;
    const elapsedMs = Date.now() - fastStartMs;
    const timeRemainingSeconds = Math.max(0, Math.round((targetMs - elapsedMs) / 1000));

    res.json({ session, timeRemainingSeconds });
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
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeResult = await pool.query(
      `SELECT * FROM fasting_sessions
       WHERE user_id = $1 AND fast_end IS NULL
       ORDER BY fast_start DESC LIMIT 1`,
      [user.id]
    );

    if (!activeResult.rows[0]) {
      return res.status(400).json({ error: 'No active fasting session' });
    }

    const active = activeResult.rows[0];
    const elapsedHours = (Date.now() - new Date(active.fast_start).getTime()) / (1000 * 60 * 60);
    const completed = elapsedHours >= active.target_hours;

    const closed = await pool.query(
      `UPDATE fasting_sessions SET
         fast_end = NOW(),
         completed = $1,
         broken_early = $2
       WHERE id = $3 RETURNING *`,
      [completed, !completed, active.id]
    );

    // Start a new session
    const newSession = await pool.query(
      `INSERT INTO fasting_sessions (user_id, fast_start, target_hours)
       VALUES ($1, NOW(), $2) RETURNING *`,
      [user.id, active.target_hours]
    );

    res.json({ closedSession: closed.rows[0], newSession: newSession.rows[0] });
  } catch (err) {
    console.error('breakFast error:', err);
    res.status(500).json({ error: 'Failed to break fast' });
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
