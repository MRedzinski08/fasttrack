export async function searchFood(req, res) {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': process.env.NUTRITIONIX_APP_ID,
        'x-app-key': process.env.NUTRITIONIX_API_KEY,
      },
      body: JSON.stringify({ query: q }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Nutritionix error:', errText);
      return res.status(502).json({ error: 'Food lookup failed', foods: [] });
    }

    const data = await response.json();

    if (!data.foods?.length) {
      return res.json({ foods: [] });
    }

    const foods = data.foods.map((f) => ({
      name: f.food_name,
      calories: Math.round(f.nf_calories),
      protein: Math.round(f.nf_protein * 10) / 10,
      carbs: Math.round(f.nf_total_carbohydrate * 10) / 10,
      fat: Math.round(f.nf_total_fat * 10) / 10,
      servingQty: f.serving_qty,
      servingUnit: f.serving_unit,
      photo: f.photo?.thumb || null,
    }));

    res.json({ foods });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
