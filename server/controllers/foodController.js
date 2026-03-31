// USDA FoodData Central API
// Docs: https://fdc.nal.usda.gov/api-guide

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs we care about
const NUTRIENT = {
  calories: 1008,
  protein:  1003,
  carbs:    1005,
  fat:      1004,
};

function getNutrient(foodNutrients, id) {
  const match = foodNutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : 0;
}

export async function searchFood(req, res) {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(q)}&api_key=${process.env.USDA_API_KEY}&pageSize=12&dataType=SR%20Legacy,Survey%20(FNDDS),Foundation,Branded`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('USDA API error:', response.status);
      return res.status(502).json({ error: 'Food lookup failed', foods: [] });
    }

    const data = await response.json();

    if (!data.foods?.length) {
      return res.json({ foods: [] });
    }

    const foods = data.foods.map((f) => {
      const nutrients = f.foodNutrients || [];
      const calories = Math.round(getNutrient(nutrients, NUTRIENT.calories));
      const protein  = getNutrient(nutrients, NUTRIENT.protein);
      const carbs    = getNutrient(nutrients, NUTRIENT.carbs);
      const fat      = getNutrient(nutrients, NUTRIENT.fat);

      // Clean up the description (USDA names are often ALL CAPS)
      const name = f.description
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      // Use serving size info if available
      const servingQty  = f.servingSize || 100;
      const servingUnit = f.servingSizeUnit || 'g';

      return { name, calories, protein, carbs, fat, servingQty, servingUnit };
    });

    // Filter out items with 0 calories (usually incomplete data)
    res.json({ foods: foods.filter((f) => f.calories > 0) });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
