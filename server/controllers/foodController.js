// Dual food search: OpenFoodFacts (branded/grocery) + USDA FoodData Central (generic)
// Standard serving sizes applied to USDA results for common foods.

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const OFF_SEARCH = 'https://world.openfoodfacts.net/cgi/search.pl';

const NUTRIENT = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 };

function getNutrient(foodNutrients, id) {
  const match = foodNutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : 0;
}

// Standard serving sizes for common whole foods (grams)
// Matched by keyword in the food name
const STANDARD_SERVINGS = [
  { keywords: ['egg', 'whole', 'raw'], grams: 50, label: '1 large egg' },
  { keywords: ['egg', 'whole', 'cooked'], grams: 50, label: '1 large egg' },
  { keywords: ['egg', 'omelet', 'scrambled'], grams: 61, label: '1 large egg scrambled' },
  { keywords: ['egg', 'whole', 'scrambled'], grams: 61, label: '1 large egg scrambled' },
  { keywords: ['egg', 'whole', 'fried'], grams: 46, label: '1 large egg fried' },
  { keywords: ['egg', 'whole', 'poached'], grams: 50, label: '1 large egg poached' },
  { keywords: ['egg', 'whole', 'hard'], grams: 50, label: '1 hard-boiled egg' },
  { keywords: ['egg', 'whole', 'boiled'], grams: 50, label: '1 hard-boiled egg' },
  { keywords: ['egg', 'grade', 'whole'], grams: 50, label: '1 large egg' },
  { keywords: ['egg', 'grade', 'white'], grams: 33, label: '1 large egg white' },
  { keywords: ['egg', 'grade', 'yolk'], grams: 17, label: '1 large yolk' },
  { keywords: ['egg', 'white'], grams: 33, label: '1 large egg white' },
  { keywords: ['egg', 'yolk'], grams: 17, label: '1 large yolk' },
  { keywords: ['egg', 'benedict'], grams: 138, label: '1 serving (138g)' },
  { keywords: ['egg', 'deviled'], grams: 62, label: '2 halves (62g)' },
  { keywords: ['chicken', 'breast'], grams: 174, label: '1 breast (174g)' },
  { keywords: ['chicken', 'thigh'], grams: 116, label: '1 thigh (116g)' },
  { keywords: ['chicken', 'wing'], grams: 34, label: '1 wing (34g)' },
  { keywords: ['chicken', 'drumstick'], grams: 72, label: '1 drumstick (72g)' },
  { keywords: ['ground', 'beef'], grams: 113, label: '4 oz patty (113g)' },
  { keywords: ['beef', 'steak'], grams: 170, label: '6 oz steak (170g)' },
  { keywords: ['salmon', 'fillet'], grams: 170, label: '6 oz fillet (170g)' },
  { keywords: ['salmon'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['tuna'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['shrimp'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['pork', 'chop'], grams: 136, label: '1 chop (136g)' },
  { keywords: ['bacon'], grams: 8, label: '1 slice (8g)' },
  { keywords: ['turkey', 'breast'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['rice', 'cooked'], grams: 158, label: '1 cup cooked (158g)' },
  { keywords: ['rice', 'white'], grams: 158, label: '1 cup cooked (158g)' },
  { keywords: ['rice', 'brown'], grams: 195, label: '1 cup cooked (195g)' },
  { keywords: ['pasta', 'cooked'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['spaghetti'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['noodle'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['bread', 'white'], grams: 30, label: '1 slice (30g)' },
  { keywords: ['bread', 'wheat'], grams: 32, label: '1 slice (32g)' },
  { keywords: ['bread'], grams: 30, label: '1 slice (30g)' },
  { keywords: ['tortilla'], grams: 49, label: '1 tortilla (49g)' },
  { keywords: ['bagel'], grams: 105, label: '1 bagel (105g)' },
  { keywords: ['oatmeal', 'cooked'], grams: 234, label: '1 cup cooked (234g)' },
  { keywords: ['oats'], grams: 40, label: '1/2 cup dry (40g)' },
  { keywords: ['milk', 'whole'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', 'skim'], grams: 245, label: '1 cup (245ml)' },
  { keywords: ['milk', '2%'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', 'reduced'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['yogurt'], grams: 170, label: '1 container (170g)' },
  { keywords: ['cheese', 'cheddar'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'mozzarella'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'american'], grams: 21, label: '1 slice (21g)' },
  { keywords: ['cheese', 'cream'], grams: 29, label: '2 tbsp (29g)' },
  { keywords: ['cheese', 'cottage'], grams: 113, label: '1/2 cup (113g)' },
  { keywords: ['butter'], grams: 14, label: '1 tbsp (14g)' },
  { keywords: ['peanut', 'butter'], grams: 32, label: '2 tbsp (32g)' },
  { keywords: ['almond', 'butter'], grams: 32, label: '2 tbsp (32g)' },
  { keywords: ['almonds'], grams: 28, label: '1 oz / 23 almonds (28g)' },
  { keywords: ['peanuts'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['walnuts'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['apple'], grams: 182, label: '1 medium apple (182g)' },
  { keywords: ['banana'], grams: 118, label: '1 medium banana (118g)' },
  { keywords: ['orange'], grams: 131, label: '1 medium orange (131g)' },
  { keywords: ['strawberr'], grams: 152, label: '1 cup (152g)' },
  { keywords: ['blueberr'], grams: 148, label: '1 cup (148g)' },
  { keywords: ['grape'], grams: 92, label: '1 cup (92g)' },
  { keywords: ['avocado'], grams: 68, label: '1/2 avocado (68g)' },
  { keywords: ['potato', 'baked'], grams: 173, label: '1 medium potato (173g)' },
  { keywords: ['potato', 'sweet'], grams: 130, label: '1 medium sweet potato (130g)' },
  { keywords: ['potato'], grams: 148, label: '1 medium potato (148g)' },
  { keywords: ['broccoli'], grams: 91, label: '1 cup chopped (91g)' },
  { keywords: ['spinach', 'raw'], grams: 30, label: '1 cup raw (30g)' },
  { keywords: ['spinach', 'cooked'], grams: 180, label: '1 cup cooked (180g)' },
  { keywords: ['spinach'], grams: 30, label: '1 cup raw (30g)' },
  { keywords: ['carrot'], grams: 61, label: '1 medium carrot (61g)' },
  { keywords: ['tomato'], grams: 123, label: '1 medium tomato (123g)' },
  { keywords: ['lettuce'], grams: 36, label: '1 cup shredded (36g)' },
  { keywords: ['corn'], grams: 90, label: '1 ear medium (90g)' },
  { keywords: ['beans', 'black'], grams: 172, label: '1 cup (172g)' },
  { keywords: ['beans', 'kidney'], grams: 177, label: '1 cup (177g)' },
  { keywords: ['lentil'], grams: 198, label: '1 cup cooked (198g)' },
  { keywords: ['tofu'], grams: 126, label: '1/2 cup (126g)' },
  { keywords: ['olive', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['coconut', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['honey'], grams: 21, label: '1 tbsp (21g)' },
  { keywords: ['sugar'], grams: 4, label: '1 tsp (4g)' },
];

function findStandardServing(foodName) {
  const nameLower = foodName.toLowerCase();
  // Try most specific match first (more keywords = more specific)
  const sorted = [...STANDARD_SERVINGS].sort((a, b) => b.keywords.length - a.keywords.length);
  for (const entry of sorted) {
    if (entry.keywords.every((kw) => nameLower.includes(kw))) {
      return entry;
    }
  }
  return null;
}

// Common preparations that should rank high for single-word searches
const COMMON_PREPS = {
  egg: ['egg whole', 'egg white', 'egg yolk', 'scrambled', 'fried', 'poached', 'hard-boiled', 'omelet', 'boiled'],
  chicken: ['chicken breast', 'chicken thigh', 'chicken wing', 'chicken drumstick', 'chicken tender'],
  rice: ['rice white', 'rice brown', 'rice cooked'],
  beef: ['ground beef', 'beef steak', 'beef patty'],
  milk: ['milk whole', 'milk 2%', 'milk skim'],
  bread: ['bread white', 'bread wheat', 'bread whole'],
  cheese: ['cheese cheddar', 'cheese mozzarella', 'cheese american', 'cheese cream'],
  potato: ['potato baked', 'potato sweet', 'potato mashed'],
  fish: ['salmon', 'tuna', 'tilapia', 'cod'],
};

function relevanceScore(name, query) {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  // Exact match
  if (nameLower === queryLower) return 100;

  // Name starts with query (e.g. "Egg, whole" for "egg")
  if (nameLower.startsWith(queryLower)) return 92;

  // First word matches query exactly (core food match)
  const nameWords = nameLower.split(/[\s,(-]+/).filter(Boolean);
  if (nameWords[0] === queryLower || nameWords[0] === queryLower + 's' || nameWords[0] === queryLower + 'es') return 88;

  // Common preparation of the searched food
  const preps = COMMON_PREPS[queryLower];
  if (preps && preps.some((p) => nameLower.includes(p))) return 85;

  // All query words appear in name
  const allMatch = queryWords.every((w) => nameLower.includes(w));
  if (allMatch) {
    // Bonus: shorter names are more likely to be the base food, not a compound dish
    const lengthPenalty = Math.max(0, (nameLower.length - 40) * 0.3);
    return Math.round(75 - lengthPenalty);
  }

  // First word of name matches a query word
  if (queryWords.includes(nameWords[0])) return 50;

  // Some query words in name
  const someMatch = queryWords.some((w) => nameLower.includes(w));
  if (someMatch) return 30;

  return 0;
}

async function searchOpenFoodFacts(query) {
  try {
    const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&search_simple=1&action=process&fields=product_name,brands,nutriments,serving_size,serving_quantity,unique_scans_n`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products?.length) return [];

    return data.products
      .filter((p) => {
        if (!p.product_name || !p.nutriments) return false;
        // Only include products where query matches the product name
        const nameLower = p.product_name.toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/);
        if (!queryWords.some((w) => nameLower.includes(w))) return false;
        // Only include popular products (scanned by real users)
        const scans = p.unique_scans_n || 0;
        if (scans < 15) return false;
        return true;
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
        const servingLabel = p.serving_size || (servingG > 0 ? `${Math.round(servingG)}g` : '100g');

        return {
          name, calories, protein, carbs, fat,
          servingQty: Math.round(servingG || 100),
          servingUnit: servingLabel,
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
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${process.env.USDA_API_KEY}&pageSize=25&dataType=SR%20Legacy,Survey%20(FNDDS),Foundation`;

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

      const name = f.description.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

      // Look up a standard serving size for this food
      const std = findStandardServing(name);
      const servingG = std ? std.grams : 100;
      const servingLabel = std ? std.label : '100g';
      const scale = servingG / 100;

      return {
        name,
        calories: Math.round(cal100 * scale),
        protein: Math.round(pro100 * scale * 10) / 10,
        carbs: Math.round(carb100 * scale * 10) / 10,
        fat: Math.round(fat100 * scale * 10) / 10,
        servingQty: servingG,
        servingUnit: servingLabel,
        hasServing: !!std,
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

    const all = [...offResults, ...usdaResults].map((f) => ({
      ...f,
      _score: relevanceScore(f.name, q) + (f.hasServing ? 10 : 0),
    }));

    all.sort((a, b) => b._score - a._score);

    const seen = new Set();
    const deduped = all.filter((f) => {
      const key = f.name.toLowerCase().replace(/\(.*\)/, '').trim().slice(0, 25);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const foods = deduped.slice(0, 15).map(({ _score, hasServing, source, ...rest }) => rest);
    res.json({ foods });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
