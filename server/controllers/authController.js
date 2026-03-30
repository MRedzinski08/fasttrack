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
  const {
    dailyCalorieGoal, fastingHours, displayName, fastingProtocol, timezone,
    currentWeight, goalWeight, heightInches, age, sex, activityLevel, weeklyLossGoal,
    onboardingComplete,
  } = req.body;
  try {
    const eatingHours = fastingHours ? 24 - fastingHours : undefined;
    const protocol = fastingProtocol || (fastingHours ? `${fastingHours}:${24 - fastingHours}` : undefined);

    const result = await pool.query(
      `UPDATE user_profiles SET
        daily_calorie_goal  = COALESCE($1, daily_calorie_goal),
        fasting_hours       = COALESCE($2, fasting_hours),
        eating_hours        = COALESCE($3, eating_hours),
        display_name        = COALESCE($4, display_name),
        fasting_protocol    = COALESCE($5, fasting_protocol),
        timezone            = COALESCE($6, timezone),
        current_weight      = COALESCE($7, current_weight),
        goal_weight         = COALESCE($8, goal_weight),
        height_inches       = COALESCE($9, height_inches),
        age                 = COALESCE($10, age),
        sex                 = COALESCE($11, sex),
        activity_level      = COALESCE($12, activity_level),
        weekly_loss_goal    = COALESCE($13, weekly_loss_goal),
        onboarding_complete = COALESCE($14, onboarding_complete)
       WHERE firebase_uid = $15
       RETURNING *`,
      [dailyCalorieGoal, fastingHours, eatingHours, displayName, protocol, timezone,
       currentWeight, goalWeight, heightInches, age, sex, activityLevel, weeklyLossGoal,
       onboardingComplete, req.user.uid]
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

// Mifflin-St Jeor BMR + activity multiplier - deficit
export function calculateRecommendedCalories(req, res) {
  const { weightLbs, heightInches, age, sex, activityLevel, weeklyLossGoal } = req.body;

  if (!weightLbs || !heightInches || !age || !sex) {
    return res.status(400).json({ error: 'weightLbs, heightInches, age, and sex are required' });
  }

  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  // Mifflin-St Jeor equation
  let bmr;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 1 lb of fat ≈ 3500 calories, so weekly deficit / 7 = daily deficit
  const dailyDeficit = Math.round(((weeklyLossGoal || 1) * 3500) / 7);
  const recommended = Math.max(1200, tdee - dailyDeficit); // floor at 1200

  res.json({ bmr: Math.round(bmr), tdee, dailyDeficit, recommended });
}
