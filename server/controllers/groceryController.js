import pool from '../db/index.js';

async function getUserId(firebaseUid) {
  const result = await pool.query(
    'SELECT id FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0]?.id;
}

export async function generateGroceryList(req, res) {
  const { days } = req.body; // which days to include (array of 0-6, or empty for all)

  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Fetch meal prep data for requested days
    let query, params;
    if (days && days.length > 0) {
      query = `SELECT * FROM meal_prep WHERE user_id = $1 AND day_of_week = ANY($2) ORDER BY day_of_week`;
      params = [userId, days];
    } else {
      query = `SELECT * FROM meal_prep WHERE user_id = $1 ORDER BY day_of_week`;
      params = [userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({
        groceryList: [],
        message: 'No meal prep plans found. Add meals to your meal prep schedule first.',
      });
    }

    // Aggregate all food items across all meal preps
    const itemMap = {};
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const prep of result.rows) {
      const items = typeof prep.food_items === 'string' ? JSON.parse(prep.food_items) : prep.food_items;
      const dayName = DAY_NAMES[prep.day_of_week];

      for (const item of (items || [])) {
        const key = item.name.toLowerCase().trim();
        if (!itemMap[key]) {
          itemMap[key] = {
            name: item.name,
            totalQty: 0,
            unit: item.servingUnit || '',
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
            days: [],
            meals: [],
          };
        }
        const qty = item.qty || 1;
        itemMap[key].totalQty += qty;
        if (!itemMap[key].days.includes(dayName)) {
          itemMap[key].days.push(dayName);
        }
        itemMap[key].meals.push(`${prep.meal_name} (${dayName})`);
      }
    }

    // Convert to sorted array
    const groceryList = Object.values(itemMap)
      .map((item) => ({
        name: item.name,
        quantity: Math.round(item.totalQty * 10) / 10,
        unit: item.unit,
        days: item.days,
        meals: item.meals,
        macros: {
          calories: Math.round(item.calories * item.totalQty),
          protein: Math.round(item.protein * item.totalQty * 10) / 10,
          carbs: Math.round(item.carbs * item.totalQty * 10) / 10,
          fat: Math.round(item.fat * item.totalQty * 10) / 10,
        },
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Summary
    const totalItems = groceryList.length;
    const totalCalories = groceryList.reduce((s, i) => s + i.macros.calories, 0);
    const totalMeals = result.rows.length;

    res.json({
      groceryList,
      summary: {
        totalItems,
        totalMeals,
        totalCalories,
        daysIncluded: [...new Set(result.rows.map(r => DAY_NAMES[r.day_of_week]))],
      },
    });
  } catch (err) {
    console.error('generateGroceryList error:', err);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
}
