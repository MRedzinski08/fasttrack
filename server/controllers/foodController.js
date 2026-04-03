// Dual food search: OpenFoodFacts (branded/grocery) + USDA FoodData Central (generic)

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const OFF_SEARCH = 'https://world.openfoodfacts.net/cgi/search.pl';

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

async function searchOpenFoodFacts(query) {
  try {
    const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&json=1&page_size=10&search_simple=1&action=process&fields=product_name,brands,nutriments,serving_size,serving_quantity`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products?.length) return [];

    return data.products
      .filter((p) => p.product_name && p.nutriments)
      .map((p) => {
        const n = p.nutriments;
        const servingG = parseFloat(p.serving_quantity) || 0;
        const hasServing = servingG > 0 && n['energy-kcal_serving'] != null;

        // Prefer per-serving data when available, otherwise scale from 100g
        const calories = Math.round(
          hasServing ? (n['energy-kcal_serving'] || 0)
                     : servingG > 0 ? (n['energy-kcal_100g'] || 0) * servingG / 100
                     : (n['energy-kcal_100g'] || 0)
        );
        const protein = Math.round((hasServing ? (n.proteins_serving || 0) : servingG > 0 ? (n.proteins_100g || 0) * servingG / 100 : (n.proteins_100g || 0)) * 10) / 10;
        const carbs = Math.round((hasServing ? (n.carbohydrates_serving || 0) : servingG > 0 ? (n.carbohydrates_100g || 0) * servingG / 100 : (n.carbohydrates_100g || 0)) * 10) / 10;
        const fat = Math.round((hasServing ? (n.fat_serving || 0) : servingG > 0 ? (n.fat_100g || 0) * servingG / 100 : (n.fat_100g || 0)) * 10) / 10;

        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const name = brand
          ? `${p.product_name} (${brand})`
          : p.product_name;

        const servingUnit = p.serving_size || (servingG > 0 ? `${servingG}g` : '100g');

        return {
          name,
          calories,
          protein,
          carbs,
          fat,
          servingQty: servingG || 100,
          servingUnit,
          source: 'openfoodfacts',
        };
      })
      .filter((f) => f.calories > 0);
  } catch (err) {
    console.error('OpenFoodFacts search error:', err.message);
    return [];
  }
}

async function searchUSDA(query) {
  try {
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${process.env.USDA_API_KEY}&pageSize=8&dataType=SR%20Legacy,Survey%20(FNDDS),Foundation,Branded`;

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url);
      if (response.ok) break;
      if (attempt < 2) await new Promise(r => setTimeout(r, 500));
    }

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.foods?.length) return [];

    return data.foods.map((f) => {
      const nutrients = f.foodNutrients || [];
      // USDA nutrients are per 100g; scale to serving size if available
      const cal100  = getNutrient(nutrients, NUTRIENT.calories);
      const pro100  = getNutrient(nutrients, NUTRIENT.protein);
      const carb100 = getNutrient(nutrients, NUTRIENT.carbs);
      const fat100  = getNutrient(nutrients, NUTRIENT.fat);

      const servingG = f.servingSize || 0;
      const scale = servingG > 0 ? servingG / 100 : 1;

      const calories = Math.round(cal100 * scale);
      const protein  = Math.round(pro100 * scale * 10) / 10;
      const carbs    = Math.round(carb100 * scale * 10) / 10;
      const fat      = Math.round(fat100 * scale * 10) / 10;

      const name = f.description
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const servingQty  = servingG || 100;
      const servingUnit = f.servingSizeUnit || 'g';

      return { name, calories, protein, carbs, fat, servingQty, servingUnit, source: 'usda' };
    }).filter((f) => f.calories > 0);
  } catch (err) {
    console.error('USDA search error:', err.message);
    return [];
  }
}

export async function searchFood(req, res) {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    // Search both sources in parallel
    const [offResults, usdaResults] = await Promise.all([
      searchOpenFoodFacts(q),
      searchUSDA(q),
    ]);

    // Deduplicate: if OFF has good results, show those first, then USDA generics
    // Remove USDA items that are similar to OFF results
    const offNames = new Set(offResults.map((f) => f.name.toLowerCase().split('(')[0].trim()));
    const filteredUSDA = usdaResults.filter((f) => {
      const simpleName = f.name.toLowerCase().split(',')[0].trim();
      return !offNames.has(simpleName);
    });

    const combined = [...offResults, ...filteredUSDA].slice(0, 15);

    res.json({ foods: combined });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
