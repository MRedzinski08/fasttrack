import OpenAI from 'openai';
import pool from '../db/index.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzePhoto(req, res) {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a food identification assistant. Analyze the photo and identify all food items visible. For each item, estimate:
- name (simple, common name)
- calories (per typical serving visible)
- protein_g
- carbs_g
- fat_g
- serving description (e.g. "1 plate", "1 bowl", "2 slices")

Respond ONLY with valid JSON in this exact format, no other text:
{"foods": [{"name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "serving": "..."}]}

If you cannot identify any food, respond: {"foods": [], "error": "Could not identify food in this image"}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What food items are in this photo? Estimate the nutritional info for each.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    res.json(result);
  } catch (err) {
    console.error('analyzePhoto error:', err.message || err);
    if (err.response) console.error('OpenAI response:', err.response);
    res.status(500).json({ error: 'Failed to analyze photo', detail: err.message });
  }
}
