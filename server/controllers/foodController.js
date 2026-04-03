// Dual food search: OpenFoodFacts (branded/grocery) + USDA FoodData Central (generic)
// OFF is great for packaged brands, USDA is great for whole/generic foods.
// Results are scored by name relevance + serving data quality, then merged.

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

// Score how well a result name matches the search query (0-100)
function relevanceScore(name, query) {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  // Exact match or starts with query
  if (nameLower === queryLower) return 100;
  if (nameLower.startsWith(queryLower)) return 90;

  // First word of name matches query
  const firstName = nameLower.split(/[\s,(-]/)[0];
  if (firstName === queryLower) return 85;

  // All query words appear in name
  const allMatch = queryWords.every((w) => nameLower.includes(w));
  if (allMatch) {
    // Bonus if query words are at the start
    const startsWithFirst = nameLower.startsWith(queryWords[0]);
    return startsWithFirst ? 75 : 60;
  }

  // At least one query word in name
  const someMatch = queryWords.some((w) => nameLower.includes(w));
  if (someMatch) return 30;

  return 0;
}

async function searchOpenFoodFacts(query) {
  try {
    const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&json=1&page_size=15&search_simple=1&action=process&fields=product_name,brands,nutriments,serving_size,serving_quantity`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products?.length) return [];

    return data.products
      .filter((p) => {
        if (!p.product_name || !p.nutriments) return false;
        // Only keep results where the query appears in the product name
        const nameLower = p.product_name.toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/);
        return queryWords.some((w) => nameLower.includes(w));
      })
      .map((p) => {
        const n = p.nutriments;
        const servingG = parseFloat(p.serving_quantity) || 0;
        const hasServing = servingG > 0 && n['energy-kcal_serving'] != null;

        const calories = Math.round(
          hasServing ? (n['energy-kcal_serving'] || 0)
                     : servingG > 0 ? (n['energy-kcal_100g'] || 0) * servingG / 100
                     : (n['energy-kcal_100g'] || 0)
        );
        const protein = Math.round((hasServing ? (n.proteins_serving || 0) : servingG > 0 ? (n.proteins_100g || 0) * servingG / 100 : (n.proteins_100g || 0)) * 10) / 10;
        const carbs = Math.round((hasServing ? (n.carbohydrates_serving || 0) : servingG > 0 ? (n.carbohydrates_100g || 0) * servingG / 100 : (n.carbohydrates_100g || 0)) * 10) / 10;
        const fat = Math.round((hasServing ? (n.fat_serving || 0) : servingG > 0 ? (n.fat_100g || 0) * servingG / 100 : (n.fat_100g || 0)) * 10) / 10;

        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const name = brand ? `${p.product_name} (${brand})` : p.product_name;
        const servingUnit = p.serving_size || (servingG > 0 ? `${servingG}g` : '100g');

        return {
          name, calories, protein, carbs, fat,
          servingQty: Math.round((servingG || 100) * 10) / 10,
          servingUnit,
          hasServing: hasServing || servingG > 0,
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
    // Only curated data types — Branded is manufacturer-submitted junk for generic searches
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${process.env.USDA_API_KEY}&pageSize=12&dataType=SR%20Legacy,Survey%20(FNDDS),Foundation`;

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

      const servingQty  = Math.round((servingG || 100) * 10) / 10;
      const servingUnit = f.servingSizeUnit || 'g';

      return {
        name, calories, protein, carbs, fat,
        servingQty, servingUnit,
        hasServing: servingG > 0,
        source: 'usda',
      };
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
    const [offResults, usdaResults] = await Promise.all([
      searchOpenFoodFacts(q),
      searchUSDA(q),
    ]);

    // Score and sort all results by relevance to the query
    const all = [...offResults, ...usdaResults].map((f) => ({
      ...f,
      _score: relevanceScore(f.name, q) + (f.hasServing ? 10 : 0),
    }));

    // Sort: highest relevance first, then prefer items with serving data
    all.sort((a, b) => b._score - a._score);

    // Deduplicate by similar name
    const seen = new Set();
    const deduped = all.filter((f) => {
      const key = f.name.toLowerCase().replace(/\(.*\)/, '').trim().slice(0, 25);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Strip internal fields before sending
    const foods = deduped.slice(0, 15).map(({ _score, hasServing, source, ...rest }) => rest);

    res.json({ foods });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
