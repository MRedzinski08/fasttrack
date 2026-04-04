import OpenAI from 'openai';
import pool from '../db/index.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getUserWithMacros(firebaseUid) {
  const userResult = await pool.query(
    'SELECT * FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  const mealsResult = await pool.query(
    `SELECT COALESCE(SUM(calories), 0) as total_cal,
            COALESCE(SUM(protein_g), 0) as total_protein,
            COALESCE(SUM(carbs_g), 0) as total_carbs,
            COALESCE(SUM(fat_g), 0) as total_fat
     FROM meal_logs
     WHERE user_id = $1
       AND eaten_at >= CURRENT_DATE
       AND eaten_at < CURRENT_DATE + INTERVAL '1 day'`,
    [user.id]
  );

  const today = mealsResult.rows[0];
  return {
    user,
    remaining: {
      calories: Math.max(0, (user.daily_calorie_goal || 2000) - parseInt(today.total_cal)),
      protein: Math.max(0, Math.round(((user.daily_calorie_goal || 2000) * 0.3 / 4) - parseFloat(today.total_protein))),
      carbs: Math.max(0, Math.round(((user.daily_calorie_goal || 2000) * 0.4 / 4) - parseFloat(today.total_carbs))),
      fat: Math.max(0, Math.round(((user.daily_calorie_goal || 2000) * 0.3 / 9) - parseFloat(today.total_fat))),
    },
    consumed: {
      calories: parseInt(today.total_cal),
      protein: parseFloat(today.total_protein),
      carbs: parseFloat(today.total_carbs),
      fat: parseFloat(today.total_fat),
    },
  };
}

export async function suggestMeal(req, res) {
  const { ingredients, preference } = req.body;

  try {
    const data = await getUserWithMacros(req.user.uid);
    if (!data) return res.status(404).json({ error: 'User not found' });

    const { remaining, consumed } = data;

    let prompt = `You are a precision nutrition meal planner. Suggest ONE specific meal with exact portions.

CRITICAL: Use USDA-standard nutrition values for COOKED portions. Do NOT estimate or round — use exact known values per ingredient. Here are reference values you MUST use:

PROTEINS (cooked weight):
- Chicken breast: 165 cal, 31g P, 0g C, 3.6g F per 100g cooked
- Ground beef 80/20: 254 cal, 17.2g P, 0g C, 20.3g F per 100g cooked
- Ground beef 90/10: 177 cal, 20g P, 0g C, 10g F per 100g cooked
- Ground beef 93/7: 150 cal, 21.4g P, 0g C, 7.1g F per 100g cooked
- Ground turkey 93/7: 150 cal, 18.6g P, 0g C, 8.3g F per 100g cooked
- Salmon: 208 cal, 22.1g P, 0g C, 13.4g F per 100g cooked
- Shrimp: 99 cal, 24g P, 0.2g C, 0.3g F per 100g cooked
- Egg, whole: 72 cal, 6.3g P, 0.4g C, 4.8g F per large egg (50g)
- Tofu, firm: 70 cal, 8g P, 1.7g C, 4.2g F per 100g

CARBS (cooked):
- White rice: 130 cal, 2.7g P, 28.2g C, 0.3g F per 100g cooked (1 cup = 158g)
- Brown rice: 111 cal, 2.6g P, 23g C, 0.9g F per 100g cooked
- Pasta: 157 cal, 5.8g P, 30.9g C, 0.9g F per 100g cooked (1 cup = 140g)
- Bread, white: 265 cal, 9g P, 49g C, 3.2g F per 100g (1 slice = 30g)
- Tortilla, flour: 312 cal, 8.2g P, 52g C, 7.4g F per 100g (1 tortilla = 49g)

VEGETABLES:
- Broccoli: 34 cal, 2.8g P, 6.6g C, 0.4g F per 100g (1 cup chopped = 91g)
- Spinach, raw: 23 cal, 2.9g P, 3.6g C, 0.4g F per 100g
- Bell pepper: 26 cal, 0.9g P, 6g C, 0.2g F per 100g
- Tomato: 18 cal, 0.9g P, 3.9g C, 0.2g F per 100g (1 medium = 123g)

FATS/OILS:
- Olive oil: 119 cal, 0g P, 0g C, 13.5g F per tbsp (14ml)
- Butter: 102 cal, 0.1g P, 0g C, 11.5g F per tbsp (14g)
- Avocado: 167 cal, 2g P, 8.6g C, 15.4g F per 100g (half = 68g)

SAUCES:
- Soy sauce: 9 cal, 0.9g P, 1g C, 0g F per tbsp
- Hot sauce: 1 cal per tsp
- Ketchup: 20 cal, 0.2g P, 5.3g C, 0g F per tbsp

The user has ${remaining.calories} calories remaining today, and needs approximately:
- ${remaining.protein}g protein remaining
- ${remaining.carbs}g carbs remaining
- ${remaining.fat}g fat remaining

So far today they've consumed ${consumed.calories} cal (P:${consumed.protein}g C:${consumed.carbs}g F:${consumed.fat}g).
`;

    if (ingredients) {
      prompt += `\nThe user has these ingredients available: ${ingredients}\nBuild a meal using primarily these ingredients.\n`;
    }

    if (preference) {
      prompt += `\nPreference: ${preference}\n`;
    }

    prompt += `
RULES:
- Calculate each item's macros by multiplying the per-100g values by the actual gram weight of the portion.
- Specify the lean/fat ratio for ground meats (e.g. "Ground beef 90/10").
- The totals MUST equal the sum of all individual items. Double-check your math.
- Use reasonable real-world portions (e.g. 4-6 oz meat, 1-1.5 cups rice, 1-2 cups vegetables).
- For the "portion" field, use a household-friendly measurement FIRST, then grams in parentheses. Examples: "1 cup cooked (158g)", "1 medium breast (170g)", "2 cups chopped (~182g)", "1 tbsp (14ml)", "1/2 avocado (~68g)". Never show grams alone.

Return a JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "mealName": "Name of the meal",
  "items": [
    { "food": "Food item name with specifics", "portion": "Household measure (grams)", "calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0 }
  ],
  "totalCalories": 0,
  "totalProtein": 0.0,
  "totalCarbs": 0.0,
  "totalFat": 0.0,
  "tip": "One sentence explaining why this meal fits their remaining macros",
  "instructions": "2-4 concise steps to prepare this meal. Keep it brief and practical."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    });

    const raw = completion.choices[0].message.content.trim();
    // Strip markdown code blocks if present
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

    const suggestion = JSON.parse(jsonStr);
    res.json({ suggestion, remaining });
  } catch (err) {
    console.error('suggestMeal error:', err);
    res.status(500).json({ error: 'Failed to generate meal suggestion' });
  }
}
