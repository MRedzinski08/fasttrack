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

  // Mood/energy data (recent)
  let moodInfo = 'No energy data logged yet';
  try {
    const moodResult = await pool.query(
      `SELECT rating, logged_at FROM mood_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 7`,
      [user.id]
    );
    if (moodResult.rows.length > 0) {
      const avg = (moodResult.rows.reduce((s, r) => s + r.rating, 0) / moodResult.rows.length).toFixed(1);
      const latest = moodResult.rows[0].rating;
      moodInfo = `Latest energy rating: ${latest}/5, 7-day avg: ${avg}/5 (${moodResult.rows.length} entries)`;
    }
  } catch {}

  // TDEE/weight data
  let tdeeInfo = 'No weight data logged yet';
  try {
    const weightResult = await pool.query(
      `SELECT weight_lbs, logged_at FROM weight_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 7`,
      [user.id]
    );
    if (weightResult.rows.length >= 2) {
      const latest = parseFloat(weightResult.rows[0].weight_lbs);
      const oldest = parseFloat(weightResult.rows[weightResult.rows.length - 1].weight_lbs);
      const change = (latest - oldest).toFixed(1);
      tdeeInfo = `Current weight: ${latest} lbs, trend: ${change > 0 ? '+' : ''}${change} lbs over last ${weightResult.rows.length} entries`;
      if (user.goal_weight) tdeeInfo += `, goal: ${user.goal_weight} lbs`;
    } else if (weightResult.rows.length === 1) {
      tdeeInfo = `Current weight: ${weightResult.rows[0].weight_lbs} lbs`;
      if (user.goal_weight) tdeeInfo += `, goal: ${user.goal_weight} lbs`;
    }
  } catch {}

  return {
    user,
    context: { todayCalories, protein, carbs, fat, fastingStatus, timeRemaining, streak, recentMeals, moodInfo, tdeeInfo },
  };
}

function buildSystemPrompt(user, context) {
  return `You are FastTrack Auto-Coach — a supportive, knowledgeable nutrition and fasting coach.

Tone: Warm but not over-the-top. Give genuine encouragement when things are going well ("You're making solid progress" not "AMAZING JOB!!!"). Be honest about gaps without being harsh — frame things as opportunities, not failures. Sound like a coach who actually cares, not a robot reading data.

Give actionable, specific advice. When macros are off, recommend specific foods. Suggest meal swaps and practical tweaks. If the user's energy or weight data suggests something, mention it naturally — don't force it.

Format responses with markdown: **bold** for emphasis, bullet points for lists, ### headers for sections. Keep responses focused and scannable. Never give medical advice.

User profile:
- Name: ${user.display_name}
- Daily calorie goal: ${user.daily_calorie_goal} cal
- Fasting protocol: ${user.fasting_protocol}

Today's data:
- Calories logged: ${context.todayCalories} cal
- Protein: ${context.protein}g | Carbs: ${context.carbs}g | Fat: ${context.fat}g
- Fasting status: ${context.fastingStatus}
- Time remaining: ${context.timeRemaining}
- Fasting streak: ${context.streak} consecutive days
- Recent meals: ${context.recentMeals}

Wellness data (use if relevant, don't force):
- Energy/mood: ${context.moodInfo}
- Weight trend: ${context.tdeeInfo}`;
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

    // Check if user has ever completed a fasting cycle
    const completedResult = await pool.query(
      `SELECT id FROM fasting_sessions WHERE user_id = $1 AND completed = TRUE LIMIT 1`,
      [user.id]
    );

    if (completedResult.rows.length === 0) {
      return res.json({
        summary: 'Your daily coaching will begin after your first fasting cycle has concluded.',
        cached: true,
      });
    }

    // Check if there's a cached summary — return it if exists (from last completed cycle)
    if (user.ai_summary_text) {
      // Check if a new cycle has completed since the last summary
      const lastSummaryDate = user.ai_summary_date
        ? (typeof user.ai_summary_date === 'string' ? user.ai_summary_date : user.ai_summary_date.toISOString().split('T')[0])
        : null;

      const newCompletedResult = await pool.query(
        `SELECT id FROM fasting_sessions
         WHERE user_id = $1 AND completed = TRUE AND fast_end > $2::date
         ORDER BY fast_end DESC LIMIT 1`,
        [user.id, lastSummaryDate || '1970-01-01']
      );

      // No new completed cycles since last summary — return cached
      if (newCompletedResult.rows.length === 0) {
        return res.json({ summary: user.ai_summary_text, cached: true });
      }
    }

    // A cycle has completed since the last summary — generate a new one
    // Get meals from the last completed eating window period
    const lastCycleResult = await pool.query(
      `SELECT fast_start, fast_end FROM fasting_sessions
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY fast_end DESC LIMIT 1`,
      [user.id]
    );
    const lastCycle = lastCycleResult.rows[0];

    // Get meals logged during that cycle
    const cycleMealsResult = await pool.query(
      `SELECT food_name, calories, protein_g, carbs_g, fat_g FROM meal_logs
       WHERE user_id = $1 AND eaten_at >= $2 AND eaten_at <= $3
       ORDER BY eaten_at`,
      [user.id, lastCycle.fast_start, lastCycle.fast_end]
    );
    const cycleMeals = cycleMealsResult.rows;
    const cycleCal = cycleMeals.reduce((s, m) => s + m.calories, 0);
    const cycleProtein = cycleMeals.reduce((s, m) => s + parseFloat(m.protein_g || 0), 0).toFixed(1);
    const cycleCarbs = cycleMeals.reduce((s, m) => s + parseFloat(m.carbs_g || 0), 0).toFixed(1);
    const cycleFat = cycleMeals.reduce((s, m) => s + parseFloat(m.fat_g || 0), 0).toFixed(1);
    const cycleFoodList = cycleMeals.map(m => `${m.food_name} (${m.calories} cal)`).join(', ') || 'No meals logged';

    const prompt = `Give a brief coaching note based on the user's last completed fasting cycle.

Last cycle data:
- Total calories consumed: ${cycleCal}/${user.daily_calorie_goal} cal
- Protein: ${cycleProtein}g | Carbs: ${cycleCarbs}g | Fat: ${cycleFat}g
- Meals: ${cycleFoodList}
- Fasting streak: ${context.streak} days
- Energy/mood: ${context.moodInfo}
- Weight trend: ${context.tdeeInfo}

Rules:
- Write in second person ("you/your"). Never use the user's name.
- Be warm and encouraging but real. Acknowledge what went well before suggesting improvements.
- Suggest a SPECIFIC food or meal for any gap.
- If energy data is available and relevant, weave it in naturally.
- If weight trend is available, reference it briefly if useful.
- Don't force mood/weight references if the data doesn't say anything interesting.
- One observation + one suggestion. Keep it under 80 words.
- Put each point on its own line, separated by a newline.
- No excessive exclamation marks. Warm but grounded.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(user, context) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    });

    const summary = completion.choices[0].message.content;
    const today = new Date().toISOString().split('T')[0];

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
