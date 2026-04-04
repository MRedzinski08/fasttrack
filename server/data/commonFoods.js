// Hand-curated common foods database
// These bypass USDA/OFF and are pinned to the top of search results.
// Nutrition per the listed serving size. Sources: USDA Foundation/SR Legacy.

const COMMON_FOODS = [
  // ─── Eggs ──────────────────────────────────────────────────────────
  { name: 'Egg, large', serving: '1 large (50g)', cal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: 'Egg, scrambled', serving: '1 large egg', cal: 91, protein: 6.1, carbs: 1.0, fat: 6.7 },
  { name: 'Egg, hard-boiled', serving: '1 large egg', cal: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: 'Egg, fried', serving: '1 large egg', cal: 90, protein: 6.3, carbs: 0.4, fat: 7.0 },
  { name: 'Egg, poached', serving: '1 large egg', cal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: 'Egg white', serving: '1 large (33g)', cal: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
  { name: 'Egg yolk', serving: '1 large (17g)', cal: 55, protein: 2.7, carbs: 0.6, fat: 4.5 },
  { name: 'Eggs, scrambled (2)', serving: '2 large eggs', cal: 182, protein: 12.2, carbs: 2.0, fat: 13.4 },
  { name: 'Eggs, scrambled (3)', serving: '3 large eggs', cal: 273, protein: 18.3, carbs: 3.0, fat: 20.1 },

  // ─── Chicken ───────────────────────────────────────────────────────
  { name: 'Chicken breast, grilled', serving: '4 oz (113g)', cal: 187, protein: 35.2, carbs: 0, fat: 4.0 },
  { name: 'Chicken breast, baked', serving: '4 oz (113g)', cal: 187, protein: 35.2, carbs: 0, fat: 4.0 },
  { name: 'Chicken thigh, bone-in', serving: '1 thigh (116g)', cal: 229, protein: 28.3, carbs: 0, fat: 12.1 },
  { name: 'Chicken thigh, boneless', serving: '1 thigh (85g)', cal: 170, protein: 21.0, carbs: 0, fat: 9.0 },
  { name: 'Chicken wing', serving: '1 wing (34g)', cal: 61, protein: 6.4, carbs: 0, fat: 3.8 },
  { name: 'Chicken drumstick', serving: '1 drumstick (72g)', cal: 130, protein: 15.7, carbs: 0, fat: 7.1 },
  { name: 'Chicken tenders', serving: '3 tenders (100g)', cal: 180, protein: 20.0, carbs: 10.0, fat: 7.0 },
  { name: 'Chicken nuggets', serving: '6 pieces (96g)', cal: 280, protein: 14.0, carbs: 18.0, fat: 17.0 },
  { name: 'Rotisserie chicken', serving: '3 oz (85g)', cal: 160, protein: 23.0, carbs: 0, fat: 7.0 },

  // ─── Beef ──────────────────────────────────────────────────────────
  { name: 'Ground beef, 80/20', serving: '4 oz cooked (113g)', cal: 287, protein: 19.4, carbs: 0, fat: 23.0 },
  { name: 'Ground beef, 90/10', serving: '4 oz cooked (113g)', cal: 200, protein: 22.6, carbs: 0, fat: 11.3 },
  { name: 'Ground beef, 93/7', serving: '4 oz cooked (113g)', cal: 170, protein: 24.0, carbs: 0, fat: 8.0 },
  { name: 'Steak, sirloin', serving: '6 oz (170g)', cal: 312, protein: 44.9, carbs: 0, fat: 13.6 },
  { name: 'Steak, ribeye', serving: '6 oz (170g)', cal: 466, protein: 38.5, carbs: 0, fat: 33.7 },
  { name: 'Steak, filet mignon', serving: '6 oz (170g)', cal: 340, protein: 42.5, carbs: 0, fat: 17.8 },

  // ─── Pork & Processed Meats ────────────────────────────────────────
  { name: 'Bacon', serving: '2 slices cooked (16g)', cal: 86, protein: 6.0, carbs: 0.2, fat: 6.7 },
  { name: 'Turkey bacon', serving: '2 slices (30g)', cal: 60, protein: 4.0, carbs: 1.0, fat: 4.5 },
  { name: 'Pork chop, boneless', serving: '1 chop (136g)', cal: 247, protein: 34.3, carbs: 0, fat: 11.3 },
  { name: 'Ham, deli sliced', serving: '4 slices (56g)', cal: 60, protein: 10.0, carbs: 2.0, fat: 1.5 },
  { name: 'Sausage, pork link', serving: '1 link (45g)', cal: 140, protein: 6.0, carbs: 1.0, fat: 12.0 },
  { name: 'Hot dog', serving: '1 hot dog (52g)', cal: 150, protein: 5.0, carbs: 2.0, fat: 13.0 },
  { name: 'Pepperoni', serving: '15 slices (28g)', cal: 138, protein: 5.7, carbs: 0.7, fat: 12.6 },

  // ─── Seafood ───────────────────────────────────────────────────────
  { name: 'Salmon, Atlantic', serving: '4 oz (113g)', cal: 234, protein: 25.0, carbs: 0, fat: 14.4 },
  { name: 'Salmon, grilled', serving: '4 oz (113g)', cal: 234, protein: 25.0, carbs: 0, fat: 14.4 },
  { name: 'Tuna, canned in water', serving: '3 oz drained (85g)', cal: 73, protein: 16.5, carbs: 0, fat: 0.8 },
  { name: 'Tuna steak', serving: '4 oz (113g)', cal: 132, protein: 28.6, carbs: 0, fat: 1.2 },
  { name: 'Shrimp', serving: '3 oz / ~12 shrimp (85g)', cal: 84, protein: 20.4, carbs: 0.2, fat: 0.2 },
  { name: 'Tilapia', serving: '1 fillet (113g)', cal: 110, protein: 23.0, carbs: 0, fat: 2.3 },
  { name: 'Cod', serving: '1 fillet (113g)', cal: 93, protein: 20.2, carbs: 0, fat: 0.8 },

  // ─── Turkey & Deli ─────────────────────────────────────────────────
  { name: 'Turkey breast, roasted', serving: '3 oz (85g)', cal: 125, protein: 25.6, carbs: 0, fat: 1.8 },
  { name: 'Turkey, ground (93/7)', serving: '4 oz cooked (113g)', cal: 170, protein: 21.0, carbs: 0, fat: 9.4 },
  { name: 'Turkey deli meat', serving: '4 slices (56g)', cal: 50, protein: 10.0, carbs: 1.0, fat: 0.5 },

  // ─── Rice & Grains ─────────────────────────────────────────────────
  { name: 'White rice, cooked', serving: '1 cup (158g)', cal: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { name: 'Brown rice, cooked', serving: '1 cup (195g)', cal: 216, protein: 5.0, carbs: 44.8, fat: 1.8 },
  { name: 'Fried rice', serving: '1 cup (198g)', cal: 238, protein: 5.5, carbs: 41.8, fat: 5.7 },
  { name: 'Quinoa, cooked', serving: '1 cup (185g)', cal: 222, protein: 8.1, carbs: 39.4, fat: 3.6 },
  { name: 'Oatmeal, cooked', serving: '1 cup (234g)', cal: 154, protein: 5.4, carbs: 27.4, fat: 2.6 },
  { name: 'Oats, dry', serving: '1/2 cup (40g)', cal: 152, protein: 5.3, carbs: 27.0, fat: 2.7 },
  { name: 'Granola', serving: '1/2 cup (55g)', cal: 260, protein: 6.0, carbs: 38.0, fat: 10.0 },
  { name: 'Cereal, Cheerios', serving: '1 cup (28g)', cal: 100, protein: 3.0, carbs: 20.0, fat: 2.0 },

  // ─── Pasta & Noodles ───────────────────────────────────────────────
  { name: 'Pasta, cooked', serving: '1 cup (140g)', cal: 220, protein: 8.1, carbs: 43.2, fat: 1.3 },
  { name: 'Spaghetti, cooked', serving: '1 cup (140g)', cal: 220, protein: 8.1, carbs: 43.2, fat: 1.3 },
  { name: 'Mac and cheese', serving: '1 cup (200g)', cal: 350, protein: 14.0, carbs: 40.0, fat: 15.0 },
  { name: 'Ramen noodles', serving: '1 packet (43g dry)', cal: 188, protein: 5.0, carbs: 26.0, fat: 7.0 },

  // ─── Bread & Bakery ────────────────────────────────────────────────
  { name: 'Bread, white', serving: '1 slice (30g)', cal: 79, protein: 2.7, carbs: 14.9, fat: 1.0 },
  { name: 'Bread, whole wheat', serving: '1 slice (32g)', cal: 81, protein: 4.0, carbs: 13.8, fat: 1.1 },
  { name: 'Bread, sourdough', serving: '1 slice (36g)', cal: 93, protein: 3.8, carbs: 18.0, fat: 0.6 },
  { name: 'Bagel, plain', serving: '1 bagel (105g)', cal: 270, protein: 10.0, carbs: 53.0, fat: 1.5 },
  { name: 'English muffin', serving: '1 muffin (57g)', cal: 132, protein: 4.4, carbs: 26.0, fat: 1.0 },
  { name: 'Tortilla, flour (8")', serving: '1 tortilla (49g)', cal: 140, protein: 3.6, carbs: 24.0, fat: 3.4 },
  { name: 'Tortilla, corn', serving: '1 tortilla (26g)', cal: 52, protein: 1.4, carbs: 10.7, fat: 0.7 },
  { name: 'Croissant', serving: '1 croissant (57g)', cal: 231, protein: 4.7, carbs: 26.1, fat: 12.0 },
  { name: 'Pancake', serving: '1 medium (38g)', cal: 86, protein: 2.5, carbs: 11.0, fat: 3.5 },
  { name: 'Waffle', serving: '1 waffle (35g)', cal: 95, protein: 2.4, carbs: 15.4, fat: 2.9 },
  { name: 'Biscuit', serving: '1 biscuit (60g)', cal: 180, protein: 3.5, carbs: 23.0, fat: 8.0 },

  // ─── Dairy ─────────────────────────────────────────────────────────
  { name: 'Milk, whole', serving: '1 cup (244ml)', cal: 149, protein: 8.0, carbs: 12.0, fat: 7.9 },
  { name: 'Milk, 2%', serving: '1 cup (244ml)', cal: 122, protein: 8.1, carbs: 11.7, fat: 4.8 },
  { name: 'Milk, 1%', serving: '1 cup (244ml)', cal: 102, protein: 8.2, carbs: 12.2, fat: 2.4 },
  { name: 'Milk, skim', serving: '1 cup (245ml)', cal: 83, protein: 8.3, carbs: 12.2, fat: 0.2 },
  { name: 'Chocolate milk', serving: '1 cup (250ml)', cal: 208, protein: 7.9, carbs: 26.0, fat: 8.5 },
  { name: 'Almond milk, unsweetened', serving: '1 cup (240ml)', cal: 30, protein: 1.0, carbs: 1.0, fat: 2.5 },
  { name: 'Oat milk', serving: '1 cup (240ml)', cal: 120, protein: 3.0, carbs: 16.0, fat: 5.0 },
  { name: 'Greek yogurt, plain, nonfat', serving: '1 container (170g)', cal: 100, protein: 17.0, carbs: 6.0, fat: 0.7 },
  { name: 'Greek yogurt, plain, whole', serving: '1 container (170g)', cal: 165, protein: 15.0, carbs: 6.0, fat: 9.0 },
  { name: 'Yogurt, vanilla', serving: '1 container (170g)', cal: 160, protein: 6.0, carbs: 27.0, fat: 2.5 },
  { name: 'Cottage cheese', serving: '1/2 cup (113g)', cal: 110, protein: 12.5, carbs: 4.6, fat: 4.7 },
  { name: 'Cheese, cheddar', serving: '1 oz (28g)', cal: 113, protein: 7.0, carbs: 0.4, fat: 9.3 },
  { name: 'Cheese, mozzarella', serving: '1 oz (28g)', cal: 85, protein: 6.3, carbs: 0.7, fat: 6.3 },
  { name: 'Cheese, Swiss', serving: '1 oz (28g)', cal: 108, protein: 7.6, carbs: 1.5, fat: 7.9 },
  { name: 'Cheese, American', serving: '1 slice (21g)', cal: 66, protein: 3.6, carbs: 1.6, fat: 5.1 },
  { name: 'Cream cheese', serving: '2 tbsp (29g)', cal: 99, protein: 1.7, carbs: 1.6, fat: 9.8 },
  { name: 'Parmesan cheese, grated', serving: '1 tbsp (5g)', cal: 22, protein: 1.9, carbs: 0.2, fat: 1.4 },
  { name: 'Butter', serving: '1 tbsp (14g)', cal: 102, protein: 0.1, carbs: 0, fat: 11.5 },
  { name: 'Sour cream', serving: '2 tbsp (30g)', cal: 60, protein: 0.7, carbs: 1.2, fat: 5.8 },
  { name: 'Ice cream, vanilla', serving: '1/2 cup (66g)', cal: 137, protein: 2.3, carbs: 15.6, fat: 7.3 },

  // ─── Fruits ────────────────────────────────────────────────────────
  { name: 'Banana', serving: '1 medium (118g)', cal: 105, protein: 1.3, carbs: 27.0, fat: 0.4 },
  { name: 'Apple', serving: '1 medium (182g)', cal: 95, protein: 0.5, carbs: 25.1, fat: 0.3 },
  { name: 'Orange', serving: '1 medium (131g)', cal: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  { name: 'Strawberries', serving: '1 cup (152g)', cal: 49, protein: 1.0, carbs: 11.7, fat: 0.5 },
  { name: 'Blueberries', serving: '1 cup (148g)', cal: 84, protein: 1.1, carbs: 21.4, fat: 0.5 },
  { name: 'Grapes', serving: '1 cup (92g)', cal: 62, protein: 0.6, carbs: 16.3, fat: 0.3 },
  { name: 'Watermelon', serving: '1 cup diced (152g)', cal: 46, protein: 0.9, carbs: 11.5, fat: 0.2 },
  { name: 'Pineapple', serving: '1 cup chunks (165g)', cal: 82, protein: 0.9, carbs: 21.6, fat: 0.2 },
  { name: 'Mango', serving: '1 cup sliced (165g)', cal: 99, protein: 1.4, carbs: 24.7, fat: 0.6 },
  { name: 'Avocado', serving: '1/2 avocado (68g)', cal: 114, protein: 1.4, carbs: 6.0, fat: 10.5 },
  { name: 'Peach', serving: '1 medium (150g)', cal: 59, protein: 1.4, carbs: 14.3, fat: 0.4 },
  { name: 'Raspberries', serving: '1 cup (123g)', cal: 64, protein: 1.5, carbs: 14.7, fat: 0.8 },
  { name: 'Cherries', serving: '1 cup (138g)', cal: 87, protein: 1.5, carbs: 22.1, fat: 0.3 },
  { name: 'Kiwi', serving: '1 kiwi (69g)', cal: 42, protein: 0.8, carbs: 10.1, fat: 0.4 },
  { name: 'Grapefruit', serving: '1/2 grapefruit (123g)', cal: 52, protein: 0.9, carbs: 13.1, fat: 0.2 },

  // ─── Vegetables ────────────────────────────────────────────────────
  { name: 'Broccoli', serving: '1 cup chopped (91g)', cal: 31, protein: 2.6, carbs: 6.0, fat: 0.3 },
  { name: 'Spinach, raw', serving: '1 cup (30g)', cal: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },
  { name: 'Spinach, cooked', serving: '1 cup (180g)', cal: 41, protein: 5.3, carbs: 6.7, fat: 0.5 },
  { name: 'Kale', serving: '1 cup chopped (67g)', cal: 33, protein: 2.2, carbs: 6.0, fat: 0.6 },
  { name: 'Carrot', serving: '1 medium (61g)', cal: 25, protein: 0.6, carbs: 5.8, fat: 0.1 },
  { name: 'Tomato', serving: '1 medium (123g)', cal: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
  { name: 'Cucumber', serving: '1/2 cup sliced (52g)', cal: 8, protein: 0.3, carbs: 1.9, fat: 0.1 },
  { name: 'Bell pepper', serving: '1 medium (119g)', cal: 31, protein: 1.0, carbs: 7.2, fat: 0.2 },
  { name: 'Onion', serving: '1 medium (110g)', cal: 44, protein: 1.2, carbs: 10.3, fat: 0.1 },
  { name: 'Mushrooms', serving: '1 cup sliced (70g)', cal: 15, protein: 2.2, carbs: 2.3, fat: 0.2 },
  { name: 'Corn', serving: '1 ear (90g)', cal: 77, protein: 2.9, carbs: 17.1, fat: 1.1 },
  { name: 'Green beans', serving: '1 cup (125g)', cal: 31, protein: 1.8, carbs: 7.0, fat: 0.1 },
  { name: 'Asparagus', serving: '4 spears (60g)', cal: 13, protein: 1.5, carbs: 2.4, fat: 0.1 },
  { name: 'Cauliflower', serving: '1 cup (107g)', cal: 27, protein: 2.0, carbs: 5.3, fat: 0.3 },
  { name: 'Zucchini', serving: '1 medium (113g)', cal: 19, protein: 1.4, carbs: 3.5, fat: 0.4 },
  { name: 'Celery', serving: '2 stalks (80g)', cal: 11, protein: 0.6, carbs: 2.4, fat: 0.1 },
  { name: 'Lettuce, romaine', serving: '1 cup shredded (36g)', cal: 6, protein: 0.4, carbs: 1.2, fat: 0.1 },

  // ─── Potatoes ──────────────────────────────────────────────────────
  { name: 'Potato, baked', serving: '1 medium (173g)', cal: 161, protein: 4.3, carbs: 36.6, fat: 0.2 },
  { name: 'Sweet potato, baked', serving: '1 medium (130g)', cal: 103, protein: 2.3, carbs: 23.6, fat: 0.1 },
  { name: 'Mashed potatoes', serving: '1 cup (210g)', cal: 237, protein: 4.0, carbs: 35.0, fat: 9.0 },
  { name: 'French fries', serving: 'small order (85g)', cal: 222, protein: 2.7, carbs: 29.0, fat: 10.6 },
  { name: 'Hash browns', serving: '1 patty (56g)', cal: 125, protein: 1.2, carbs: 12.3, fat: 8.0 },

  // ─── Legumes ───────────────────────────────────────────────────────
  { name: 'Black beans', serving: '1/2 cup (86g)', cal: 114, protein: 7.6, carbs: 20.4, fat: 0.5 },
  { name: 'Chickpeas', serving: '1/2 cup (82g)', cal: 134, protein: 7.3, carbs: 22.5, fat: 2.1 },
  { name: 'Lentils, cooked', serving: '1/2 cup (99g)', cal: 115, protein: 8.9, carbs: 20.0, fat: 0.4 },
  { name: 'Kidney beans', serving: '1/2 cup (89g)', cal: 112, protein: 7.7, carbs: 20.2, fat: 0.4 },
  { name: 'Edamame', serving: '1/2 cup shelled (78g)', cal: 95, protein: 8.5, carbs: 7.6, fat: 3.9 },
  { name: 'Hummus', serving: '2 tbsp (30g)', cal: 70, protein: 2.0, carbs: 6.0, fat: 4.5 },
  { name: 'Tofu, firm', serving: '1/2 cup (126g)', cal: 88, protein: 10.1, carbs: 2.2, fat: 5.3 },

  // ─── Nuts & Seeds ──────────────────────────────────────────────────
  { name: 'Almonds', serving: '1 oz / 23 almonds (28g)', cal: 164, protein: 6.0, carbs: 6.1, fat: 14.2 },
  { name: 'Peanuts', serving: '1 oz (28g)', cal: 161, protein: 7.3, carbs: 4.6, fat: 14.0 },
  { name: 'Walnuts', serving: '1 oz / 14 halves (28g)', cal: 185, protein: 4.3, carbs: 3.9, fat: 18.5 },
  { name: 'Cashews', serving: '1 oz / 18 cashews (28g)', cal: 157, protein: 5.2, carbs: 8.6, fat: 12.4 },
  { name: 'Peanut butter', serving: '2 tbsp (32g)', cal: 188, protein: 8.0, carbs: 6.0, fat: 16.0 },
  { name: 'Almond butter', serving: '2 tbsp (32g)', cal: 196, protein: 6.8, carbs: 6.0, fat: 17.8 },
  { name: 'Trail mix', serving: '1/4 cup (40g)', cal: 173, protein: 5.0, carbs: 17.0, fat: 11.0 },
  { name: 'Sunflower seeds', serving: '1 oz (28g)', cal: 165, protein: 5.5, carbs: 6.5, fat: 14.0 },
  { name: 'Chia seeds', serving: '1 tbsp (12g)', cal: 58, protein: 2.0, carbs: 5.0, fat: 3.7 },

  // ─── Condiments & Oils ─────────────────────────────────────────────
  { name: 'Olive oil', serving: '1 tbsp (14ml)', cal: 119, protein: 0, carbs: 0, fat: 13.5 },
  { name: 'Coconut oil', serving: '1 tbsp (14ml)', cal: 121, protein: 0, carbs: 0, fat: 13.5 },
  { name: 'Mayonnaise', serving: '1 tbsp (15g)', cal: 94, protein: 0.1, carbs: 0.1, fat: 10.3 },
  { name: 'Ketchup', serving: '1 tbsp (17g)', cal: 20, protein: 0.2, carbs: 5.3, fat: 0 },
  { name: 'Mustard', serving: '1 tsp (5g)', cal: 3, protein: 0.2, carbs: 0.3, fat: 0.2 },
  { name: 'Ranch dressing', serving: '2 tbsp (30g)', cal: 129, protein: 0.4, carbs: 1.8, fat: 13.4 },
  { name: 'Honey', serving: '1 tbsp (21g)', cal: 64, protein: 0.1, carbs: 17.3, fat: 0 },
  { name: 'Maple syrup', serving: '1 tbsp (20ml)', cal: 52, protein: 0, carbs: 13.4, fat: 0 },
  { name: 'Salsa', serving: '2 tbsp (36g)', cal: 10, protein: 0.5, carbs: 2.0, fat: 0.1 },
  { name: 'Soy sauce', serving: '1 tbsp (16ml)', cal: 9, protein: 0.9, carbs: 1.0, fat: 0 },
  { name: 'Hot sauce', serving: '1 tsp (5ml)', cal: 1, protein: 0.1, carbs: 0, fat: 0 },

  // ─── Beverages ─────────────────────────────────────────────────────
  { name: 'Orange juice', serving: '1 cup (248ml)', cal: 112, protein: 1.7, carbs: 25.8, fat: 0.5 },
  { name: 'Apple juice', serving: '1 cup (248ml)', cal: 114, protein: 0.3, carbs: 28.0, fat: 0.3 },
  { name: 'Coffee, black', serving: '1 cup (237ml)', cal: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Protein shake', serving: '1 scoop + water', cal: 120, protein: 24.0, carbs: 3.0, fat: 1.5 },

  // ─── Snacks ────────────────────────────────────────────────────────
  { name: 'Tortilla chips', serving: '1 oz / ~10 chips (28g)', cal: 142, protein: 2.0, carbs: 17.7, fat: 7.4 },
  { name: 'Potato chips', serving: '1 oz / ~15 chips (28g)', cal: 152, protein: 2.0, carbs: 15.0, fat: 9.8 },
  { name: 'Popcorn, air-popped', serving: '3 cups popped (24g)', cal: 93, protein: 3.0, carbs: 18.6, fat: 1.1 },
  { name: 'Pretzels', serving: '1 oz (28g)', cal: 108, protein: 2.8, carbs: 22.5, fat: 1.0 },
  { name: 'Crackers, saltine', serving: '5 crackers (15g)', cal: 62, protein: 1.3, carbs: 10.6, fat: 1.5 },
  { name: 'Protein bar', serving: '1 bar (60g)', cal: 210, protein: 20.0, carbs: 22.0, fat: 7.0 },
  { name: 'Granola bar', serving: '1 bar (42g)', cal: 190, protein: 3.0, carbs: 29.0, fat: 7.0 },

  // ─── Common Meals ──────────────────────────────────────────────────
  { name: 'Pizza, cheese (1 slice)', serving: '1 slice (107g)', cal: 272, protein: 12.3, carbs: 33.6, fat: 10.0 },
  { name: 'Pizza, pepperoni (1 slice)', serving: '1 slice (113g)', cal: 298, protein: 13.2, carbs: 33.3, fat: 12.5 },
  { name: 'Burrito, bean and cheese', serving: '1 burrito (200g)', cal: 380, protein: 15.0, carbs: 55.0, fat: 12.0 },
  { name: 'Taco, beef', serving: '1 taco (78g)', cal: 156, protein: 8.0, carbs: 14.0, fat: 7.5 },
  { name: 'Sandwich, turkey', serving: '1 sandwich', cal: 320, protein: 22.0, carbs: 34.0, fat: 10.0 },
  { name: 'Grilled cheese sandwich', serving: '1 sandwich', cal: 366, protein: 14.0, carbs: 28.0, fat: 22.0 },
  { name: 'PB&J sandwich', serving: '1 sandwich', cal: 376, protein: 13.0, carbs: 48.0, fat: 16.0 },
  { name: 'Chili, beef', serving: '1 cup (253g)', cal: 264, protein: 21.0, carbs: 22.0, fat: 10.0 },
  { name: 'Soup, chicken noodle', serving: '1 cup (245g)', cal: 62, protein: 3.2, carbs: 7.1, fat: 2.4 },
  { name: 'Soup, tomato', serving: '1 cup (245g)', cal: 74, protein: 1.9, carbs: 16.0, fat: 0.7 },

  // ─── Sweets & Desserts ─────────────────────────────────────────────
  { name: 'Cookie, chocolate chip', serving: '1 cookie (30g)', cal: 140, protein: 1.5, carbs: 19.0, fat: 7.0 },
  { name: 'Brownie', serving: '1 brownie (56g)', cal: 227, protein: 2.7, carbs: 36.0, fat: 9.0 },
  { name: 'Donut, glazed', serving: '1 donut (60g)', cal: 269, protein: 3.6, carbs: 31.0, fat: 14.8 },
  { name: 'Chocolate, dark', serving: '1 oz (28g)', cal: 155, protein: 1.4, carbs: 17.4, fat: 9.0 },
  { name: 'Chocolate, milk', serving: '1 oz (28g)', cal: 153, protein: 2.1, carbs: 17.1, fat: 8.7 },

  // ─── Sugar & Sweeteners ────────────────────────────────────────────
  { name: 'Sugar, white', serving: '1 tsp (4g)', cal: 16, protein: 0, carbs: 4.0, fat: 0 },
  { name: 'Sugar, brown', serving: '1 tsp packed (5g)', cal: 17, protein: 0, carbs: 4.5, fat: 0 },
];

export default COMMON_FOODS;
