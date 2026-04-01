import pool from '../db/index.js';

// MET (Metabolic Equivalent of Task) database
// Calories burned = MET × weight_kg × duration_hours
const EXERCISES = [
  // Cardio
  { name: 'Walking (casual)', met: 2.5, category: 'Cardio' },
  { name: 'Walking (brisk)', met: 3.8, category: 'Cardio' },
  { name: 'Walking (uphill)', met: 5.3, category: 'Cardio' },
  { name: 'Jogging', met: 7.0, category: 'Cardio' },
  { name: 'Running (6 mph)', met: 9.8, category: 'Cardio' },
  { name: 'Running (8 mph)', met: 11.8, category: 'Cardio' },
  { name: 'Running (10 mph)', met: 14.5, category: 'Cardio' },
  { name: 'Sprinting', met: 15.0, category: 'Cardio' },
  { name: 'Cycling (casual)', met: 4.0, category: 'Cardio' },
  { name: 'Cycling (moderate)', met: 6.8, category: 'Cardio' },
  { name: 'Cycling (vigorous)', met: 10.0, category: 'Cardio' },
  { name: 'Stationary Bike (moderate)', met: 5.5, category: 'Cardio' },
  { name: 'Stationary Bike (vigorous)', met: 8.5, category: 'Cardio' },
  { name: 'Swimming (leisure)', met: 4.5, category: 'Cardio' },
  { name: 'Swimming (laps, moderate)', met: 7.0, category: 'Cardio' },
  { name: 'Swimming (laps, vigorous)', met: 10.0, category: 'Cardio' },
  { name: 'Rowing Machine', met: 7.0, category: 'Cardio' },
  { name: 'Elliptical', met: 5.0, category: 'Cardio' },
  { name: 'Stair Climber', met: 9.0, category: 'Cardio' },
  { name: 'Jump Rope', met: 11.0, category: 'Cardio' },
  { name: 'Dancing', met: 5.5, category: 'Cardio' },
  { name: 'Hiking', met: 6.0, category: 'Cardio' },

  // Strength
  { name: 'Weight Lifting (light)', met: 3.0, category: 'Strength' },
  { name: 'Weight Lifting (moderate)', met: 5.0, category: 'Strength' },
  { name: 'Weight Lifting (vigorous)', met: 6.0, category: 'Strength' },
  { name: 'Bodyweight Exercises', met: 3.8, category: 'Strength' },
  { name: 'Push-ups', met: 3.8, category: 'Strength' },
  { name: 'Pull-ups', met: 4.5, category: 'Strength' },
  { name: 'Squats', met: 5.0, category: 'Strength' },
  { name: 'Deadlifts', met: 6.0, category: 'Strength' },
  { name: 'Bench Press', met: 5.0, category: 'Strength' },
  { name: 'Kettlebell Training', met: 6.0, category: 'Strength' },
  { name: 'Resistance Bands', met: 3.5, category: 'Strength' },
  { name: 'CrossFit', met: 8.0, category: 'Strength' },

  // Sports
  { name: 'Basketball', met: 6.5, category: 'Sports' },
  { name: 'Soccer', met: 7.0, category: 'Sports' },
  { name: 'Tennis', met: 7.3, category: 'Sports' },
  { name: 'Volleyball', met: 4.0, category: 'Sports' },
  { name: 'Golf (walking)', met: 4.3, category: 'Sports' },
  { name: 'Boxing (punching bag)', met: 5.5, category: 'Sports' },
  { name: 'Boxing (sparring)', met: 9.0, category: 'Sports' },
  { name: 'Martial Arts', met: 10.3, category: 'Sports' },
  { name: 'Rock Climbing', met: 8.0, category: 'Sports' },
  { name: 'Racquetball', met: 7.0, category: 'Sports' },
  { name: 'Badminton', met: 5.5, category: 'Sports' },
  { name: 'Ice Skating', met: 5.5, category: 'Sports' },
  { name: 'Skiing (downhill)', met: 6.0, category: 'Sports' },
  { name: 'Snowboarding', met: 5.3, category: 'Sports' },

  // Flexibility & Mind-Body
  { name: 'Yoga (hatha)', met: 2.5, category: 'Flexibility' },
  { name: 'Yoga (power/vinyasa)', met: 4.0, category: 'Flexibility' },
  { name: 'Pilates', met: 3.0, category: 'Flexibility' },
  { name: 'Stretching', met: 2.3, category: 'Flexibility' },
  { name: 'Tai Chi', met: 3.0, category: 'Flexibility' },

  // HIIT & Circuit
  { name: 'HIIT', met: 8.0, category: 'HIIT' },
  { name: 'Circuit Training', met: 8.0, category: 'HIIT' },
  { name: 'Burpees', met: 8.0, category: 'HIIT' },
  { name: 'Tabata', met: 9.0, category: 'HIIT' },

  // Daily Activities
  { name: 'Yard Work', met: 4.0, category: 'Daily' },
  { name: 'Housework (light)', met: 2.5, category: 'Daily' },
  { name: 'Housework (heavy)', met: 4.0, category: 'Daily' },
  { name: 'Playing with Kids', met: 4.0, category: 'Daily' },
  { name: 'Shoveling Snow', met: 6.0, category: 'Daily' },
];

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id, current_weight FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0];
}

export function getExercises(req, res) {
  const { q, category } = req.query;
  let results = EXERCISES;

  if (q) {
    const query = q.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(query));
  }

  if (category) {
    results = results.filter((e) => e.category === category);
  }

  res.json({ exercises: results, categories: [...new Set(EXERCISES.map((e) => e.category))] });
}

export async function logExercise(req, res) {
  const { exerciseName, metValue, durationMin } = req.body;
  if (!exerciseName || !metValue || !durationMin) {
    return res.status(400).json({ error: 'exerciseName, metValue, and durationMin are required' });
  }

  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calories = MET × weight_kg × hours
    const weightKg = user.current_weight ? user.current_weight * 0.453592 : 70; // default 70kg
    const hours = durationMin / 60;
    const caloriesBurned = Math.round(metValue * weightKg * hours);

    const result = await pool.query(
      `INSERT INTO exercise_logs (user_id, exercise_name, met_value, duration_min, calories_burned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, exerciseName, metValue, durationMin, caloriesBurned]
    );

    res.status(201).json({ exercise: result.rows[0] });
  } catch (err) {
    console.error('logExercise error:', err);
    res.status(500).json({ error: 'Failed to log exercise' });
  }
}

export async function getTodayExercises(req, res) {
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT * FROM exercise_logs
       WHERE user_id = $1
         AND logged_at >= CURRENT_DATE
         AND logged_at < CURRENT_DATE + INTERVAL '1 day'
       ORDER BY logged_at DESC`,
      [user.id]
    );

    const totalBurned = result.rows.reduce((s, e) => s + e.calories_burned, 0);
    res.json({ exercises: result.rows, totalBurned });
  } catch (err) {
    console.error('getTodayExercises error:', err);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
}

export async function deleteExercise(req, res) {
  const { id } = req.params;
  try {
    const user = await getUserId(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      'DELETE FROM exercise_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Exercise not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('deleteExercise error:', err);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
}
