import OpenAI from 'openai';
import pool from '../db/index.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getUserContext(firebaseUid) {
  const userResult = await pool.query(
    'SELECT * FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  const mealsResult = await pool.query(
    `SELECT food_name, calories, protein_g, carbs_g, fat_g, eaten_at
     FROM meal_logs
     WHERE user_id = $1
       AND eaten_at >= CURRENT_DATE
       AND eaten_at < CURRENT_DATE + INTERVAL '1 day'
     ORDER BY eaten_at DESC`,
    [user.id]
  );

  const fastResult = await pool.query(
    `SELECT * FROM fasting_sessions
     WHERE user_id = $1 AND fast_end IS NULL
     ORDER BY fast_start DESC LIMIT 1`,
    [user.id]
  );

  const streakResult = await pool.query(
    `SELECT COUNT(*) FROM fasting_sessions
     WHERE user_id = $1 AND completed = TRUE
       AND fast_start >= NOW() - INTERVAL '30 days'`,
    [user.id]
  );

  const meals = mealsResult.rows;
  const activeFast = fastResult.rows[0];
  const streak = parseInt(streakResult.rows[0].count);

  const todayCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const protein = meals.reduce((sum, m) => sum + parseFloat(m.protein_g || 0), 0).toFixed(1);
  const carbs = meals.reduce((sum, m) => sum + parseFloat(m.carbs_g || 0), 0).toFixed(1);
  const fat = meals.reduce((sum, m) => sum + parseFloat(m.fat_g || 0), 0).toFixed(1);

  let fastingStatus = 'No active fast';
  let timeRemaining = 'N/A';
  if (activeFast) {
    const targetMs = activeFast.target_hours * 60 * 60 * 1000;
    const elapsedMs = Date.now() - new Date(activeFast.fast_start).getTime();
    const remainingMs = targetMs - elapsedMs;
    if (remainingMs > 0) {
      const hrs = Math.floor(remainingMs / 3600000);
      const mins = Math.floor((remainingMs % 3600000) / 60000);
      fastingStatus = 'Currently fasting';
      timeRemaining = `${hrs}h ${mins}m remaining`;
    } else {
      fastingStatus = 'Eating window open';
      timeRemaining = 'Eating window is open';
    }
  }

  const recentMeals = meals.slice(0, 5).map((m) => `${m.food_name} (${m.calories} kcal)`).join(', ') || 'None logged yet';

  return {
    user,
    context: { todayCalories, protein, carbs, fat, fastingStatus, timeRemaining, streak, recentMeals },
  };
}

function buildSystemPrompt(user, context) {
  return `You are FastTrack Auto-Coach, a sharp nutrition and intermittent fasting advisor.
Go beyond just reporting numbers — give actionable, specific advice. When macros are off, recommend specific foods to fix the gap (e.g. "Add Greek yogurt or cottage cheese to boost protein"). Suggest meal swaps, timing adjustments, and diet tweaks based on patterns you see. Be direct but constructive. Never give medical advice.

Format your responses with markdown: use **bold** for emphasis, bullet points for lists, and ### headers to organize sections. Keep responses focused and scannable.

User profile:
- Name: ${user.display_name}
- Daily calorie goal: ${user.daily_calorie_goal} kcal
- Fasting protocol: ${user.fasting_protocol}

Today's data:
- Calories logged: ${context.todayCalories} kcal
- Protein: ${context.protein}g | Carbs: ${context.carbs}g | Fat: ${context.fat}g
- Fasting status: ${context.fastingStatus}
- Time remaining in fast: ${context.timeRemaining}
- Fasting streak: ${context.streak} consecutive days
- Recent meals: ${context.recentMeals}`;
}

export async function chat(req, res) {
  const { message, history = [] } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const data = await getUserContext(req.user.uid);
    if (!data) return res.status(404).json({ error: 'User not found' });

    const systemPrompt = buildSystemPrompt(data.user, data.context);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // keep last 10 messages for context
      { role: 'user', content: message },
    ];

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      max_tokens: 500,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed' });
    }
  }
}

export async function getDailySummary(req, res) {
  try {
    const data = await getUserContext(req.user.uid);
    if (!data) return res.status(404).json({ error: 'User not found' });

    const { user, context } = data;
    const today = new Date().toISOString().split('T')[0];

    // Return cached summary if already generated today
    const summaryDate = user.ai_summary_date
      ? (typeof user.ai_summary_date === 'string' ? user.ai_summary_date : user.ai_summary_date.toISOString().split('T')[0])
      : null;
    if (summaryDate === today) {
      return res.json({ summary: user.ai_summary_text, cached: true });
    }

    const prompt = `You are a daily nutrition coach. Analyze today's data and give a brief, actionable coaching note.

Data:
- Calories: ${context.todayCalories}/${user.daily_calorie_goal} kcal
- Protein: ${context.protein}g | Carbs: ${context.carbs}g | Fat: ${context.fat}g
- Fasting: ${context.fastingStatus} (${context.timeRemaining})
- Streak: ${context.streak} days
- Recent meals: ${context.recentMeals}

Rules:
- Write in second person ("you/your"). Never use the user's name. No greetings, no "Great job".
- Go beyond just stating numbers. Identify the biggest gap or opportunity and suggest a SPECIFIC food or meal to fix it (e.g. "Your protein is 30g short — a chicken breast or Greek yogurt at your next meal would close that gap").
- If meals are carb-heavy, suggest a swap. If fat is high, suggest a leaner alternative. If calories are low, suggest calorie-dense whole foods.
- One insight + one specific recommendation. Keep it under 80 words.
- Put each point on its own line, separated by a newline.
- No exclamation marks. Direct but constructive.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(user, context) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    });

    const summary = completion.choices[0].message.content;

    // Cache in DB
    await pool.query(
      `UPDATE user_profiles SET ai_summary_date = $1, ai_summary_text = $2
       WHERE firebase_uid = $3`,
      [today, summary, req.user.uid]
    );

    res.json({ summary, cached: false });
  } catch (err) {
    console.error('getDailySummary error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}
