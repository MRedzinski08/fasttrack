import pool from '../db/index.js';

export async function registerUser(req, res) {
  const { firebaseUid, email, displayName } = req.body;
  if (!firebaseUid || !email) {
    return res.status(400).json({ error: 'firebaseUid and email are required' });
  }
  try {
    // Upsert — safe to call multiple times
    const result = await pool.query(
      `INSERT INTO user_profiles (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE
         SET email = EXCLUDED.email,
             display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name)
       RETURNING *`,
      [firebaseUid, email, displayName || email.split('@')[0]]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('registerUser error:', err);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
}

export async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE firebase_uid = $1',
      [req.user.uid]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export async function updateProfile(req, res) {
  const { dailyCalorieGoal, fastingHours, displayName, fastingProtocol, timezone } = req.body;
  try {
    const eatingHours = fastingHours ? 24 - fastingHours : undefined;
    const protocol = fastingProtocol || (fastingHours ? `${fastingHours}:${24 - fastingHours}` : undefined);

    const result = await pool.query(
      `UPDATE user_profiles SET
        daily_calorie_goal = COALESCE($1, daily_calorie_goal),
        fasting_hours      = COALESCE($2, fasting_hours),
        eating_hours       = COALESCE($3, eating_hours),
        display_name       = COALESCE($4, display_name),
        fasting_protocol   = COALESCE($5, fasting_protocol),
        timezone           = COALESCE($6, timezone)
       WHERE firebase_uid = $7
       RETURNING *`,
      [dailyCalorieGoal, fastingHours, eatingHours, displayName, protocol, timezone, req.user.uid]
    );

    // If fasting hours changed, update the active fasting session's target
    if (fastingHours && result.rows[0]) {
      await pool.query(
        `UPDATE fasting_sessions SET target_hours = $1
         WHERE user_id = $2 AND fast_end IS NULL`,
        [fastingHours, result.rows[0].id]
      );
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
