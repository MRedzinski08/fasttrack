import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0]?.id;
}

// Day mapping: 0=Sunday, 1=Monday, ... 6=Saturday
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getMealPrep(req, res) {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      'SELECT * FROM meal_prep WHERE user_id = $1 ORDER BY day_of_week, id',
      [userId]
    );

    res.json({ mealPreps: result.rows, today: new Date().getDay() });
  } catch (err) {
    console.error('getMealPrep error:', err);
    res.status(500).json({ error: 'Failed to fetch meal prep' });
  }
}

export async function addMealPrep(req, res) {
  const { dayOfWeek, mealName, foodItems } = req.body;
  if (dayOfWeek == null || !mealName || !foodItems?.length) {
    return res.status(400).json({ error: 'dayOfWeek, mealName, and foodItems are required' });
  }

  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const totalCalories = foodItems.reduce((s, f) => s + Math.round((f.calories || 0) * (f.qty || 1)), 0);
    const totalProtein = foodItems.reduce((s, f) => s + Math.round((f.protein || 0) * (f.qty || 1) * 10) / 10, 0);
    const totalCarbs = foodItems.reduce((s, f) => s + Math.round((f.carbs || 0) * (f.qty || 1) * 10) / 10, 0);
    const totalFat = foodItems.reduce((s, f) => s + Math.round((f.fat || 0) * (f.qty || 1) * 10) / 10, 0);

    const result = await pool.query(
      `INSERT INTO meal_prep (user_id, day_of_week, meal_name, food_items, total_calories, total_protein, total_carbs, total_fat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, dayOfWeek, mealName, JSON.stringify(foodItems), totalCalories, totalProtein, totalCarbs, totalFat]
    );

    res.status(201).json({ meal: result.rows[0] });
  } catch (err) {
    console.error('addMealPrep error:', err);
    res.status(500).json({ error: 'Failed to add meal prep' });
  }
}

export async function deleteMealPrep(req, res) {
  const { id } = req.params;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      'DELETE FROM meal_prep WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Meal not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteMealPrep error:', err);
    res.status(500).json({ error: 'Failed to delete meal prep' });
  }
}

export async function logPrepMeal(req, res) {
  // Log all food items from a prepped meal as actual meal logs
  const { id } = req.params;
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const prepResult = await pool.query(
      'SELECT * FROM meal_prep WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!prepResult.rows[0]) return res.status(404).json({ error: 'Meal not found' });

    const prep = prepResult.rows[0];
    const items = typeof prep.food_items === 'string' ? JSON.parse(prep.food_items) : prep.food_items;
    const now = new Date();

    for (const item of items) {
      const qty = item.qty || 1;
      await pool.query(
        `INSERT INTO meal_logs (user_id, food_name, calories, protein_g, carbs_g, fat_g, quantity, unit, eaten_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          item.name,
          Math.round((item.calories || 0) * qty),
          Math.round((item.protein || 0) * qty * 10) / 10,
          Math.round((item.carbs || 0) * qty * 10) / 10,
          Math.round((item.fat || 0) * qty * 10) / 10,
          qty,
          item.servingUnit || null,
          now,
        ]
      );
    }

    res.json({ logged: true, itemCount: items.length });
  } catch (err) {
    console.error('logPrepMeal error:', err);
    res.status(500).json({ error: 'Failed to log prepped meal' });
  }
}
