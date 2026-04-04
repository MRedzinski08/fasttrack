// Dual food search: OpenFoodFacts (branded/grocery) + USDA FoodData Central (generic)
// Standard serving sizes applied to USDA results for common foods.
// OFF results require serving data + 40+ scans. USDA results without a
// standard serving match are excluded to avoid raw per-100g results.

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const OFF_SEARCH = 'https://world.openfoodfacts.net/cgi/search.pl';

const NUTRIENT = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 };
const BLOCKED = ['babyfood', 'baby food', 'infant', 'formula', 'dog food', 'cat food', 'pet'];

function getNutrient(foodNutrients, id) {
  const match = foodNutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : 0;
}

// ─── Standard serving sizes for common whole foods ───────────────────
// Matched by keywords in the food name. More keywords = more specific.
const STANDARD_SERVINGS = [
  // Eggs
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
  { keywords: ['egg', 'creamed'], grams: 120, label: '1/2 cup (120g)' },
  { keywords: ['egg', 'burrito'], grams: 113, label: '1 burrito (113g)' },
  { keywords: ['egg', 'salad'], grams: 120, label: '1/2 cup (120g)' },
  // Poultry
  { keywords: ['chicken', 'breast', 'grilled'], grams: 174, label: '1 breast (174g)' },
  { keywords: ['chicken', 'breast', 'baked'], grams: 174, label: '1 breast (174g)' },
  { keywords: ['chicken', 'breast', 'fried'], grams: 174, label: '1 breast (174g)' },
  { keywords: ['chicken', 'breast'], grams: 174, label: '1 breast (174g)' },
  { keywords: ['chicken', 'thigh'], grams: 116, label: '1 thigh (116g)' },
  { keywords: ['chicken', 'wing'], grams: 34, label: '1 wing (34g)' },
  { keywords: ['chicken', 'drumstick'], grams: 72, label: '1 drumstick (72g)' },
  { keywords: ['chicken', 'tender'], grams: 33, label: '1 tender (33g)' },
  { keywords: ['chicken', 'nugget'], grams: 16, label: '1 nugget (16g)' },
  { keywords: ['chicken', 'strip'], grams: 56, label: '1 strip (56g)' },
  { keywords: ['turkey', 'breast'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['turkey', 'ground'], grams: 113, label: '4 oz (113g)' },
  { keywords: ['turkey', 'deli'], grams: 56, label: '2 oz / 4 slices (56g)' },
  // Red meat
  { keywords: ['ground', 'beef'], grams: 113, label: '4 oz patty (113g)' },
  { keywords: ['beef', 'steak'], grams: 170, label: '6 oz steak (170g)' },
  { keywords: ['beef', 'roast'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['steak', 'sirloin'], grams: 170, label: '6 oz steak (170g)' },
  { keywords: ['steak', 'ribeye'], grams: 170, label: '6 oz steak (170g)' },
  { keywords: ['pork', 'chop'], grams: 136, label: '1 chop (136g)' },
  { keywords: ['pork', 'tenderloin'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['pork', 'ground'], grams: 113, label: '4 oz (113g)' },
  { keywords: ['bacon', 'cooked'], grams: 8, label: '1 slice cooked (8g)' },
  { keywords: ['bacon'], grams: 8, label: '1 slice (8g)' },
  { keywords: ['sausage', 'link'], grams: 45, label: '1 link (45g)' },
  { keywords: ['sausage', 'patty'], grams: 56, label: '1 patty (56g)' },
  { keywords: ['sausage'], grams: 56, label: '1 patty (56g)' },
  { keywords: ['ham', 'deli'], grams: 56, label: '2 oz / 4 slices (56g)' },
  { keywords: ['ham'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['hot', 'dog'], grams: 52, label: '1 hot dog (52g)' },
  { keywords: ['hamburger'], grams: 113, label: '1 patty (113g)' },
  // Seafood
  { keywords: ['salmon', 'fillet'], grams: 170, label: '6 oz fillet (170g)' },
  { keywords: ['salmon'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['tuna', 'canned'], grams: 85, label: '3 oz drained (85g)' },
  { keywords: ['tuna', 'steak'], grams: 170, label: '6 oz steak (170g)' },
  { keywords: ['tuna'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['shrimp'], grams: 85, label: '3 oz / ~12 shrimp (85g)' },
  { keywords: ['tilapia'], grams: 113, label: '1 fillet (113g)' },
  { keywords: ['cod'], grams: 113, label: '1 fillet (113g)' },
  { keywords: ['crab'], grams: 85, label: '3 oz (85g)' },
  { keywords: ['lobster'], grams: 85, label: '3 oz (85g)' },
  // Grains & starches
  { keywords: ['rice', 'white', 'cooked'], grams: 158, label: '1 cup cooked (158g)' },
  { keywords: ['rice', 'brown', 'cooked'], grams: 195, label: '1 cup cooked (195g)' },
  { keywords: ['rice', 'white'], grams: 158, label: '1 cup cooked (158g)' },
  { keywords: ['rice', 'brown'], grams: 195, label: '1 cup cooked (195g)' },
  { keywords: ['rice', 'cooked'], grams: 158, label: '1 cup cooked (158g)' },
  { keywords: ['rice', 'fried'], grams: 198, label: '1 cup (198g)' },
  { keywords: ['quinoa'], grams: 185, label: '1 cup cooked (185g)' },
  { keywords: ['pasta', 'cooked'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['spaghetti'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['macaroni'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['noodle'], grams: 140, label: '1 cup cooked (140g)' },
  { keywords: ['bread', 'white'], grams: 30, label: '1 slice (30g)' },
  { keywords: ['bread', 'wheat'], grams: 32, label: '1 slice (32g)' },
  { keywords: ['bread', 'whole'], grams: 32, label: '1 slice (32g)' },
  { keywords: ['bread', 'sourdough'], grams: 36, label: '1 slice (36g)' },
  { keywords: ['bread', 'rye'], grams: 32, label: '1 slice (32g)' },
  { keywords: ['bread'], grams: 30, label: '1 slice (30g)' },
  { keywords: ['tortilla', 'flour'], grams: 49, label: '1 tortilla (49g)' },
  { keywords: ['tortilla', 'corn'], grams: 26, label: '1 tortilla (26g)' },
  { keywords: ['tortilla'], grams: 49, label: '1 tortilla (49g)' },
  { keywords: ['bagel'], grams: 105, label: '1 bagel (105g)' },
  { keywords: ['english', 'muffin'], grams: 57, label: '1 muffin (57g)' },
  { keywords: ['muffin', 'blueberry'], grams: 113, label: '1 medium muffin (113g)' },
  { keywords: ['pancake'], grams: 38, label: '1 pancake (38g)' },
  { keywords: ['waffle'], grams: 35, label: '1 waffle (35g)' },
  { keywords: ['croissant'], grams: 57, label: '1 croissant (57g)' },
  { keywords: ['biscuit'], grams: 60, label: '1 biscuit (60g)' },
  { keywords: ['oatmeal', 'cooked'], grams: 234, label: '1 cup cooked (234g)' },
  { keywords: ['oats'], grams: 40, label: '1/2 cup dry (40g)' },
  { keywords: ['cereal'], grams: 30, label: '1 cup (30g)' },
  { keywords: ['granola'], grams: 55, label: '1/2 cup (55g)' },
  // Dairy
  { keywords: ['milk', 'whole'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', 'skim'], grams: 245, label: '1 cup (245ml)' },
  { keywords: ['milk', '2%'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', '1%'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', 'reduced'], grams: 244, label: '1 cup (244ml)' },
  { keywords: ['milk', 'chocolate'], grams: 250, label: '1 cup (250ml)' },
  { keywords: ['milk', 'almond'], grams: 240, label: '1 cup (240ml)' },
  { keywords: ['milk', 'oat'], grams: 240, label: '1 cup (240ml)' },
  { keywords: ['milk', 'soy'], grams: 243, label: '1 cup (243ml)' },
  { keywords: ['yogurt', 'greek'], grams: 170, label: '1 container (170g)' },
  { keywords: ['yogurt'], grams: 170, label: '1 container (170g)' },
  { keywords: ['cheese', 'cheddar'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'mozzarella'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'swiss'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'parmesan'], grams: 5, label: '1 tbsp grated (5g)' },
  { keywords: ['cheese', 'american'], grams: 21, label: '1 slice (21g)' },
  { keywords: ['cheese', 'cream'], grams: 29, label: '2 tbsp (29g)' },
  { keywords: ['cheese', 'cottage'], grams: 113, label: '1/2 cup (113g)' },
  { keywords: ['cheese', 'ricotta'], grams: 62, label: '1/4 cup (62g)' },
  { keywords: ['cheese', 'feta'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cheese', 'brie'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['butter'], grams: 14, label: '1 tbsp (14g)' },
  { keywords: ['sour', 'cream'], grams: 30, label: '2 tbsp (30g)' },
  { keywords: ['whipped', 'cream'], grams: 15, label: '2 tbsp (15g)' },
  { keywords: ['ice', 'cream'], grams: 66, label: '1/2 cup (66g)' },
  // Nuts, seeds & spreads
  { keywords: ['peanut', 'butter'], grams: 32, label: '2 tbsp (32g)' },
  { keywords: ['almond', 'butter'], grams: 32, label: '2 tbsp (32g)' },
  { keywords: ['almonds'], grams: 28, label: '1 oz / 23 almonds (28g)' },
  { keywords: ['peanuts'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['walnuts'], grams: 28, label: '1 oz / 14 halves (28g)' },
  { keywords: ['cashews'], grams: 28, label: '1 oz / 18 cashews (28g)' },
  { keywords: ['pecans'], grams: 28, label: '1 oz / 19 halves (28g)' },
  { keywords: ['pistachios'], grams: 28, label: '1 oz / 49 pistachios (28g)' },
  { keywords: ['mixed', 'nuts'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['sunflower', 'seeds'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['chia', 'seeds'], grams: 12, label: '1 tbsp (12g)' },
  { keywords: ['flax', 'seeds'], grams: 10, label: '1 tbsp (10g)' },
  // Fruits
  { keywords: ['apple'], grams: 182, label: '1 medium apple (182g)' },
  { keywords: ['banana'], grams: 118, label: '1 medium banana (118g)' },
  { keywords: ['orange'], grams: 131, label: '1 medium orange (131g)' },
  { keywords: ['grapefruit'], grams: 123, label: '1/2 grapefruit (123g)' },
  { keywords: ['peach'], grams: 150, label: '1 medium peach (150g)' },
  { keywords: ['pear'], grams: 178, label: '1 medium pear (178g)' },
  { keywords: ['plum'], grams: 66, label: '1 plum (66g)' },
  { keywords: ['mango'], grams: 165, label: '1 cup sliced (165g)' },
  { keywords: ['pineapple'], grams: 165, label: '1 cup chunks (165g)' },
  { keywords: ['watermelon'], grams: 152, label: '1 cup diced (152g)' },
  { keywords: ['cantaloupe'], grams: 160, label: '1 cup diced (160g)' },
  { keywords: ['strawberr'], grams: 152, label: '1 cup (152g)' },
  { keywords: ['blueberr'], grams: 148, label: '1 cup (148g)' },
  { keywords: ['raspberr'], grams: 123, label: '1 cup (123g)' },
  { keywords: ['blackberr'], grams: 144, label: '1 cup (144g)' },
  { keywords: ['grape'], grams: 92, label: '1 cup (92g)' },
  { keywords: ['cherr'], grams: 138, label: '1 cup (138g)' },
  { keywords: ['kiwi'], grams: 69, label: '1 kiwi (69g)' },
  { keywords: ['avocado'], grams: 68, label: '1/2 avocado (68g)' },
  { keywords: ['coconut', 'shredded'], grams: 15, label: '2 tbsp (15g)' },
  { keywords: ['raisins'], grams: 43, label: '1 small box (43g)' },
  { keywords: ['dates'], grams: 24, label: '1 date (24g)' },
  // Vegetables
  { keywords: ['potato', 'baked'], grams: 173, label: '1 medium potato (173g)' },
  { keywords: ['potato', 'sweet'], grams: 130, label: '1 medium sweet potato (130g)' },
  { keywords: ['potato', 'mashed'], grams: 210, label: '1 cup (210g)' },
  { keywords: ['potato', 'fries'], grams: 85, label: '1 small order (85g)' },
  { keywords: ['french', 'fries'], grams: 85, label: '1 small order (85g)' },
  { keywords: ['potato'], grams: 148, label: '1 medium potato (148g)' },
  { keywords: ['broccoli'], grams: 91, label: '1 cup chopped (91g)' },
  { keywords: ['cauliflower'], grams: 107, label: '1 cup (107g)' },
  { keywords: ['spinach', 'raw'], grams: 30, label: '1 cup raw (30g)' },
  { keywords: ['spinach', 'cooked'], grams: 180, label: '1 cup cooked (180g)' },
  { keywords: ['spinach'], grams: 30, label: '1 cup raw (30g)' },
  { keywords: ['kale'], grams: 67, label: '1 cup chopped (67g)' },
  { keywords: ['carrot'], grams: 61, label: '1 medium carrot (61g)' },
  { keywords: ['celery'], grams: 40, label: '1 medium stalk (40g)' },
  { keywords: ['tomato'], grams: 123, label: '1 medium tomato (123g)' },
  { keywords: ['cucumber'], grams: 52, label: '1/2 cup sliced (52g)' },
  { keywords: ['lettuce'], grams: 36, label: '1 cup shredded (36g)' },
  { keywords: ['onion'], grams: 110, label: '1 medium onion (110g)' },
  { keywords: ['bell', 'pepper'], grams: 119, label: '1 medium pepper (119g)' },
  { keywords: ['pepper', 'green'], grams: 119, label: '1 medium pepper (119g)' },
  { keywords: ['mushroom'], grams: 70, label: '1 cup sliced (70g)' },
  { keywords: ['corn'], grams: 90, label: '1 ear medium (90g)' },
  { keywords: ['green', 'beans'], grams: 125, label: '1 cup (125g)' },
  { keywords: ['peas'], grams: 145, label: '1 cup (145g)' },
  { keywords: ['zucchini'], grams: 113, label: '1 medium (113g)' },
  { keywords: ['asparagus'], grams: 60, label: '4 spears (60g)' },
  { keywords: ['cabbage'], grams: 89, label: '1 cup shredded (89g)' },
  // Legumes
  { keywords: ['beans', 'black'], grams: 172, label: '1 cup (172g)' },
  { keywords: ['beans', 'kidney'], grams: 177, label: '1 cup (177g)' },
  { keywords: ['beans', 'pinto'], grams: 171, label: '1 cup (171g)' },
  { keywords: ['chickpeas'], grams: 164, label: '1 cup (164g)' },
  { keywords: ['garbanzo'], grams: 164, label: '1 cup (164g)' },
  { keywords: ['lentil'], grams: 198, label: '1 cup cooked (198g)' },
  { keywords: ['edamame'], grams: 155, label: '1 cup shelled (155g)' },
  { keywords: ['tofu'], grams: 126, label: '1/2 cup (126g)' },
  { keywords: ['hummus'], grams: 30, label: '2 tbsp (30g)' },
  // Oils, fats & condiments
  { keywords: ['olive', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['coconut', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['vegetable', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['canola', 'oil'], grams: 14, label: '1 tbsp (14ml)' },
  { keywords: ['mayonnaise'], grams: 15, label: '1 tbsp (15g)' },
  { keywords: ['ketchup'], grams: 17, label: '1 tbsp (17g)' },
  { keywords: ['mustard'], grams: 5, label: '1 tsp (5g)' },
  { keywords: ['salsa'], grams: 36, label: '2 tbsp (36g)' },
  { keywords: ['soy', 'sauce'], grams: 16, label: '1 tbsp (16ml)' },
  { keywords: ['honey'], grams: 21, label: '1 tbsp (21g)' },
  { keywords: ['maple', 'syrup'], grams: 20, label: '1 tbsp (20ml)' },
  { keywords: ['sugar', 'white'], grams: 4, label: '1 tsp (4g)' },
  { keywords: ['sugar', 'brown'], grams: 5, label: '1 tsp packed (5g)' },
  { keywords: ['sugar'], grams: 4, label: '1 tsp (4g)' },
  { keywords: ['jam'], grams: 20, label: '1 tbsp (20g)' },
  { keywords: ['jelly'], grams: 20, label: '1 tbsp (20g)' },
  // Beverages
  { keywords: ['orange', 'juice'], grams: 248, label: '1 cup (248ml)' },
  { keywords: ['apple', 'juice'], grams: 248, label: '1 cup (248ml)' },
  { keywords: ['coffee', 'black'], grams: 237, label: '1 cup (237ml)' },
  { keywords: ['coffee'], grams: 237, label: '1 cup (237ml)' },
  { keywords: ['tea'], grams: 237, label: '1 cup (237ml)' },
  // Snacks
  { keywords: ['tortilla', 'chips'], grams: 28, label: '1 oz / ~10 chips (28g)' },
  { keywords: ['potato', 'chips'], grams: 28, label: '1 oz / ~15 chips (28g)' },
  { keywords: ['popcorn'], grams: 28, label: '3 cups popped (28g)' },
  { keywords: ['pretzel'], grams: 28, label: '1 oz (28g)' },
  { keywords: ['cracker'], grams: 28, label: '1 oz / ~5 crackers (28g)' },
  { keywords: ['trail', 'mix'], grams: 40, label: '1/4 cup (40g)' },
  // Prepared / common meals
  { keywords: ['pizza'], grams: 107, label: '1 slice (107g)' },
  { keywords: ['burrito'], grams: 200, label: '1 burrito (200g)' },
  { keywords: ['taco'], grams: 78, label: '1 taco (78g)' },
  { keywords: ['sandwich'], grams: 150, label: '1 sandwich (150g)' },
  { keywords: ['soup'], grams: 245, label: '1 cup (245g)' },
  { keywords: ['salad'], grams: 85, label: '1 cup (85g)' },
  { keywords: ['chili'], grams: 253, label: '1 cup (253g)' },
  // Desserts
  { keywords: ['cookie'], grams: 30, label: '1 cookie (30g)' },
  { keywords: ['brownie'], grams: 56, label: '1 brownie (56g)' },
  { keywords: ['cake'], grams: 80, label: '1 slice (80g)' },
  { keywords: ['pie'], grams: 117, label: '1 slice (117g)' },
  { keywords: ['donut'], grams: 60, label: '1 donut (60g)' },
  { keywords: ['doughnut'], grams: 60, label: '1 doughnut (60g)' },
  { keywords: ['chocolate', 'bar'], grams: 41, label: '1 bar (41g)' },
  { keywords: ['chocolate'], grams: 28, label: '1 oz (28g)' },
];

function findStandardServing(foodName) {
  const nameLower = foodName.toLowerCase();
  // Try most specific match first (more keywords = more specific)
  const sorted = [...STANDARD_SERVINGS].sort((a, b) => b.keywords.length - a.keywords.length);
  for (const entry of sorted) {
    // Each keyword must appear in the name, allowing for plurals (egg/eggs)
    const allMatch = entry.keywords.every((kw) => {
      if (nameLower.includes(kw)) return true;
      // Try plural/singular variants
      if (nameLower.includes(kw + 's')) return true;
      if (kw.endsWith('s') && nameLower.includes(kw.slice(0, -1))) return true;
      return false;
    });
    if (allMatch) return entry;
  }
  return null;
}

// ─── Relevance scoring ───────────────────────────────────────────────

const COMMON_PREPS = {
  egg: ['egg whole', 'egg white', 'egg yolk', 'scrambled', 'fried', 'poached', 'hard-boiled', 'omelet', 'boiled'],
  chicken: ['chicken breast', 'chicken thigh', 'chicken wing', 'chicken drumstick', 'chicken tender'],
  rice: ['rice white', 'rice brown', 'rice cooked', 'rice fried'],
  beef: ['ground beef', 'beef steak', 'beef patty', 'beef roast'],
  pork: ['pork chop', 'pork tenderloin', 'pork ground', 'bacon', 'ham'],
  milk: ['milk whole', 'milk 2%', 'milk skim', 'milk 1%', 'milk chocolate', 'milk almond', 'milk oat'],
  bread: ['bread white', 'bread wheat', 'bread whole', 'bread sourdough', 'bread rye'],
  cheese: ['cheese cheddar', 'cheese mozzarella', 'cheese american', 'cheese cream', 'cheese swiss', 'cheese cottage'],
  potato: ['potato baked', 'potato sweet', 'potato mashed', 'french fries'],
  fish: ['salmon', 'tuna', 'tilapia', 'cod'],
  yogurt: ['yogurt greek', 'yogurt plain', 'yogurt vanilla'],
  pasta: ['spaghetti', 'macaroni', 'noodle', 'pasta cooked'],
  banana: ['banana raw', 'banana'],
  apple: ['apple raw', 'apple'],
  salmon: ['salmon fillet', 'salmon raw', 'salmon cooked'],
  turkey: ['turkey breast', 'turkey ground', 'turkey deli'],
};

function relevanceScore(name, query) {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/);

  // Normalize: strip commas, extra spaces for comparison
  const nClean = n.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const nWords = nClean.split(' ');

  // ── Tier 1 (100): The food IS the query ──
  // "egg" → "Egg, Whole, Raw" or "Eggs, Grade A, Large, Egg Whole"
  // Check if after removing filler words, the name is basically just the food + a preparation
  const FILLER = ['grade', 'a', 'large', 'medium', 'small', 'raw', 'fresh', 'plain', 'regular', 'ns', 'as', 'to', 'fat', 'type', 'with', 'made', 'no', 'added', 'or', 'and', 'the', 'in', 'of', 'for'];
  const PREPS = ['whole', 'white', 'yolk', 'scrambled', 'fried', 'poached', 'boiled', 'hard-boiled', 'soft-boiled', 'baked', 'grilled', 'roasted', 'steamed', 'raw', 'cooked', 'dried', 'canned', 'frozen', 'smoked', 'braised', 'sauteed', 'broiled', 'mashed', 'sliced', 'chopped', 'shredded', 'ground', 'diced', 'omelet', 'omelette', 'pickled', 'marinated', 'seasoned', 'breaded', 'blanched', 'pureed', 'fresh'];
  // BLOCKED is defined at module scope

  // Get the "core" words of the name: remove fillers and preps
  const coreWords = nWords.filter(w => !FILLER.includes(w) && !PREPS.includes(w));
  // Check if all core words relate to the query
  const queryStem = q.replace(/s$/, ''); // egg from eggs
  const coreIsQuery = coreWords.length > 0 && coreWords.every(w => {
    const wStem = w.replace(/s$/, '');
    return wStem === queryStem || queryStem.includes(wStem) || wStem.includes(queryStem);
  });

  if (coreIsQuery) {
    // It's THE food — now rank by simplicity (fewer words = more basic)
    return 100 - Math.min(nWords.length, 15);
  }

  // ── Tier 2 (80): Common preparation of the food ──
  const preps = COMMON_PREPS[q];
  if (preps && preps.some(p => n.includes(p))) {
    return 80 - Math.min(nWords.length * 0.5, 10);
  }

  // ── Tier 3 (60): All query words are in the name ──
  const allMatch = qWords.every(w => n.includes(w));
  if (allMatch) {
    // Penalize long names (compound dishes)
    return 60 - Math.min(n.length * 0.3, 25);
  }

  // ── Tier 4 (30): Query word appears somewhere ──
  const someMatch = qWords.some(w => n.includes(w));
  if (someMatch) return 30 - Math.min(n.length * 0.2, 20);

  return 0;
}

// ─── OpenFoodFacts search (branded/grocery) ──────────────────────────

async function searchOpenFoodFacts(query) {
  try {
    const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&json=1&page_size=30&search_simple=1&action=process&fields=product_name,brands,nutriments,serving_size,serving_quantity,unique_scans_n`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products?.length) return [];

    return data.products
      .filter((p) => {
        if (!p.product_name || !p.nutriments) return false;
        // Product name must START with a query word (not just contain it)
        // This prevents "Mini Eggs" matching for "egg" or "Mayonnaise" for "egg"
        const nameLower = p.product_name.toLowerCase();
        const nameFirst = nameLower.split(/[\s,(-]+/)[0];
        const queryWords = query.toLowerCase().split(/\s+/);
        const nameStartsWithQuery = queryWords.some((w) => {
          const wStem = w.replace(/s$/, '');
          return nameFirst === w || nameFirst === w + 's' || nameFirst === wStem || nameFirst.startsWith(w);
        });
        if (!nameStartsWithQuery) return false;
        // Must have serving data — no per-100g guesses
        const servingG = parseFloat(p.serving_quantity) || 0;
        if (servingG <= 0) return false;
        // Must be popular (30+ scans)
        if ((p.unique_scans_n || 0) < 30) return false;
        return true;
      })
      .map((p) => {
        const n = p.nutriments;
        const servingG = parseFloat(p.serving_quantity);
        const hasServing = n['energy-kcal_serving'] != null;

        const calories = Math.round(hasServing ? (n['energy-kcal_serving'] || 0) : (n['energy-kcal_100g'] || 0) * servingG / 100);
        const protein = Math.round((hasServing ? (n.proteins_serving || 0) : (n.proteins_100g || 0) * servingG / 100) * 10) / 10;
        const carbs = Math.round((hasServing ? (n.carbohydrates_serving || 0) : (n.carbohydrates_100g || 0) * servingG / 100) * 10) / 10;
        const fat = Math.round((hasServing ? (n.fat_serving || 0) : (n.fat_100g || 0) * servingG / 100) * 10) / 10;

        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const name = brand ? `${p.product_name} (${brand})` : p.product_name;

        return {
          name, calories, protein, carbs, fat,
          servingQty: Math.round(servingG),
          servingUnit: p.serving_size || `${Math.round(servingG)}g`,
          hasServing: true,
          scans: p.unique_scans_n || 0,
          source: 'openfoodfacts',
        };
      })
      .filter((f) => f.calories > 0)
      .sort((a, b) => b.scans - a.scans); // Most popular first
  } catch (err) {
    console.error('OpenFoodFacts search error:', err.message);
    return [];
  }
}

// ─── USDA search (whole/generic foods) ───────────────────────────────

async function searchUSDA(query) {
  try {
    // For single-word queries with common preps, search for the base + specific preparations
    const queries = [query];
    const preps = COMMON_PREPS[query.toLowerCase()];
    if (preps && query.trim().split(/\s+/).length === 1) {
      // Add targeted searches like "egg whole raw", "egg scrambled", "egg fried"
      const extraQueries = preps.slice(0, 4).map(p => p.includes(' ') ? p : `${query} ${p}`);
      queries.push(...extraQueries);
    }

    // Fetch all queries in parallel
    const allFoods = [];
    const seen = new Set();
    await Promise.all(queries.map(async (q) => {
      const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(q)}&api_key=${process.env.USDA_API_KEY}&pageSize=10&dataType=SR%20Legacy,Survey%20(FNDDS),Foundation`;
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetch(url);
        if (response.ok) break;
        if (attempt < 1) await new Promise(r => setTimeout(r, 300));
      }
      if (!response?.ok) return;
      const data = await response.json();
      for (const f of (data.foods || [])) {
        if (!seen.has(f.fdcId)) {
          seen.add(f.fdcId);
          allFoods.push(f);
        }
      }
    }));

    if (!allFoods.length) return [];

    return allFoods
      .map((f) => {
        const nutrients = f.foodNutrients || [];
        const cal100  = getNutrient(nutrients, NUTRIENT.calories);
        const pro100  = getNutrient(nutrients, NUTRIENT.protein);
        const carb100 = getNutrient(nutrients, NUTRIENT.carbs);
        const fat100  = getNutrient(nutrients, NUTRIENT.fat);

        const name = f.description.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

        // Skip blocked items
        if (BLOCKED.some((b) => name.toLowerCase().includes(b))) return null;

        const std = findStandardServing(name);
        const servingG = std ? std.grams : 100;
        const servingLabel = std ? std.label : '1 serving (100g)';
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
      })
      .filter((f) => f && f.calories > 0);
  } catch (err) {
    console.error('USDA search error:', err.message);
    return [];
  }
}

// ─── Combined search ─────────────────────────────────────────────────

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
      _score: relevanceScore(f.name, q),
    }));

    all.sort((a, b) => b._score - a._score);

    const seen = new Set();
    const deduped = all.filter((f) => {
      const key = f.name.toLowerCase().replace(/\(.*\)/, '').trim().slice(0, 25);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const foods = deduped.slice(0, 15).map(({ _score, hasServing, source, scans, ...rest }) => rest);
    res.json({ foods });
  } catch (err) {
    console.error('searchFood error:', err);
    res.status(500).json({ error: 'Food search failed', foods: [] });
  }
}
