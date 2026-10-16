// Built-in food list. Works offline, no key needed.
// [name, aliases, serving label, grams per serving, kcal, protein, carbs, fat]  (values per serving)
const RAW = [
  // breakfast
  ['Egg, boiled', 'egg eggs boiled egg hard boiled', '1 large', 50, 78, 6.3, 0.6, 5.3],
  ['Egg, fried', 'fried egg', '1 large', 46, 90, 6.3, 0.4, 6.8],
  ['Scrambled eggs', 'scrambled', '2 eggs', 120, 200, 13.5, 2.2, 15],
  ['Omelette', 'omelet', '2 eggs', 125, 190, 13, 1.5, 14.5],
  ['Oats, cooked', 'oatmeal porridge oats', '1 cup', 234, 158, 5.9, 27, 3.2],
  ['Maltabella / sorghum porridge', 'maltabella sorghum', '1 cup', 240, 150, 4, 32, 1],
  ['Muesli', 'granola', '½ cup', 55, 210, 5.5, 36, 5],
  ['Corn flakes', 'cornflakes cereal', '1 cup', 30, 110, 2, 25, 0.2],
  ['Weet-Bix', 'weetbix weetabix', '2 biscuits', 33, 120, 4, 22, 0.7],
  ['White bread', 'bread toast slice white', '1 slice', 30, 80, 2.7, 15, 1],
  ['Brown / whole wheat bread', 'brown bread wholewheat whole wheat wholegrain', '1 slice', 32, 82, 4, 14, 1.1],
  ['Bread roll', 'roll bun', '1 roll', 60, 165, 5.5, 30, 2.4],
  ['Croissant', '', '1 medium', 57, 230, 4.7, 26, 12],
  ['Pancake', 'pancakes flapjack crumpet', '1 medium', 40, 90, 2.5, 11, 3.8],
  ['Butter', '', '1 tsp', 5, 36, 0, 0, 4.1],
  ['Margarine', 'rama flora', '1 tsp', 5, 26, 0, 0, 2.9],
  ['Peanut butter', 'pb', '1 tbsp', 16, 94, 4, 3.1, 8],
  ['Jam', 'jelly', '1 tbsp', 20, 50, 0.1, 13, 0],
  ['Honey', '', '1 tbsp', 21, 64, 0.1, 17, 0],
  ['Avocado', 'avo', '½ fruit', 75, 120, 1.5, 6.4, 11],
  ['Bacon', 'rashers', '2 rashers', 20, 108, 7.4, 0.3, 8.4],
  ['Sausage', 'pork sausage', '1 link', 45, 140, 6, 1.5, 12],
  ['Boerewors', 'wors', '1 piece (100g)', 100, 280, 14, 2, 24],
  // dairy
  ['Milk, full cream', 'milk whole milk', '1 cup', 250, 160, 8, 12, 8.5],
  ['Milk, low fat', 'low fat milk skim 2%', '1 cup', 250, 120, 8.5, 12, 4.5],
  ['Yoghurt, plain', 'yogurt plain', '1 cup', 175, 110, 6, 8, 6],
  ['Greek yoghurt', 'greek yogurt', '1 cup', 170, 150, 17, 6, 7],
  ['Cheddar cheese', 'cheese', '1 slice', 25, 100, 6.2, 0.3, 8.3],
  ['Cottage cheese', '', '½ cup', 113, 110, 12.5, 4, 4.8],
  ['Mozzarella', '', '30 g', 30, 85, 6.3, 0.7, 6.3],
  // fruit
  ['Apple', 'apples', '1 medium', 180, 95, 0.5, 25, 0.3],
  ['Banana', 'bananas', '1 medium', 118, 105, 1.3, 27, 0.4],
  ['Orange', 'naartjie mandarin', '1 medium', 130, 62, 1.2, 15, 0.2],
  ['Pear', '', '1 medium', 178, 100, 0.6, 27, 0.2],
  ['Grapes', '', '1 cup', 150, 104, 1.1, 27, 0.2],
  ['Strawberries', 'strawberry', '1 cup', 150, 48, 1, 11.5, 0.5],
  ['Blueberries', 'berries', '1 cup', 148, 85, 1.1, 21, 0.5],
  ['Mango', '', '1 cup', 165, 99, 1.4, 25, 0.6],
  ['Watermelon', 'melon', '1 cup', 152, 46, 0.9, 11.5, 0.2],
  ['Pineapple', '', '1 cup', 165, 82, 0.9, 22, 0.2],
  ['Dried fruit mix', 'raisins dried fruit', '¼ cup', 40, 120, 1, 31, 0.2],
  // veg
  ['Salad, mixed greens', 'salad greens lettuce', '1 bowl', 100, 20, 1.5, 3.5, 0.2],
  ['Tomato', 'tomatoes', '1 medium', 123, 22, 1.1, 4.8, 0.2],
  ['Cucumber', '', '½ cup', 52, 8, 0.3, 1.9, 0.1],
  ['Broccoli', '', '1 cup', 91, 31, 2.5, 6, 0.3],
  ['Carrots', 'carrot', '1 cup', 128, 52, 1.2, 12, 0.3],
  ['Spinach, cooked', 'spinach morogo', '1 cup', 180, 41, 5.3, 6.8, 0.5],
  ['Butternut, roasted', 'butternut pumpkin squash', '1 cup', 205, 82, 1.8, 21.5, 0.2],
  ['Sweet potato', 'sweet potatoes', '1 medium', 130, 112, 2, 26, 0.1],
  ['Potato, boiled', 'potato potatoes', '1 medium', 170, 145, 3.1, 33, 0.2],
  ['Mashed potato', 'mash', '1 cup', 210, 214, 4, 35, 7],
  ['Chips / fries', 'chips fries french fries slap chips', 'medium portion', 117, 365, 4, 48, 17],
  ['Corn on the cob', 'mealie corn', '1 cob', 100, 96, 3.4, 21, 1.5],
  ['Mixed vegetables', 'veggies vegetables veg', '1 cup', 150, 80, 3.5, 15, 0.5],
  ['Coleslaw', '', '½ cup', 70, 100, 0.8, 7.5, 7.5],
  // starches
  ['White rice, cooked', 'rice white rice', '1 cup', 158, 205, 4.3, 45, 0.4],
  ['Brown rice, cooked', 'brown rice', '1 cup', 195, 216, 5, 45, 1.8],
  ['Pasta, cooked', 'pasta spaghetti macaroni noodles', '1 cup', 140, 220, 8, 43, 1.3],
  ['Pap / maize porridge', 'pap mieliepap ugali sadza maize meal phutu', '1 cup', 240, 220, 5, 47, 1],
  ['Couscous', '', '1 cup', 157, 176, 6, 36, 0.3],
  ['Quinoa, cooked', 'quinoa', '1 cup', 185, 222, 8, 39, 3.6],
  ['Tortilla wrap', 'wrap tortilla', '1 wrap', 64, 200, 5.5, 34, 4.5],
  ['Roti', 'chapati', '1 roti', 70, 210, 5, 32, 7],
  ['Vetkoek', 'fat cake magwinya', '1 medium', 80, 280, 5.5, 36, 13],
  // protein
  ['Chicken breast, grilled', 'chicken breast grilled chicken', '1 breast', 120, 198, 37, 0, 4.3],
  ['Chicken thigh', 'chicken thigh', '1 thigh', 85, 177, 21, 0, 10],
  ['Fried chicken', 'kfc chicken piece', '1 piece', 120, 320, 26, 11, 19],
  ['Beef steak', 'steak beef rump sirloin', '200 g', 200, 500, 52, 0, 32],
  ['Beef mince, cooked', 'mince ground beef', '1 cup', 140, 330, 32, 0, 22],
  ['Lamb chop', 'lamb chops', '1 chop', 90, 260, 20, 0, 20],
  ['Pork chop', 'pork', '1 chop', 145, 300, 38, 0, 16],
  ['Salmon', 'salmon fillet', '1 fillet', 150, 310, 33, 0, 19],
  ['White fish, grilled', 'fish hake grilled fish', '1 fillet', 150, 160, 33, 0, 2],
  ['Fish, fried', 'fried fish battered fish fish and chips', '1 piece', 150, 330, 22, 18, 19],
  ['Tuna, canned in water', 'tuna', '1 can', 120, 130, 29, 0, 1],
  ['Biltong', 'jerky', '50 g', 50, 160, 28, 1, 5],
  ['Lentils, cooked', 'lentils dhal', '1 cup', 198, 230, 18, 40, 0.8],
  ['Beans, baked', 'baked beans', '½ cup', 130, 120, 6, 21, 0.5],
  ['Chickpeas', 'chickpea hummus chana', '½ cup', 82, 134, 7.3, 22, 2.1],
  ['Tofu', '', '100 g', 100, 145, 15.5, 4, 8.5],
  ['Protein shake', 'whey shake', '1 scoop', 30, 120, 24, 3, 1.5],
  // meals
  ['Pizza slice', 'pizza', '1 slice', 107, 285, 12, 36, 10],
  ['Burger', 'hamburger cheeseburger', '1 burger', 220, 540, 30, 40, 29],
  ['Hot dog', 'boerie roll', '1 hot dog', 100, 290, 10, 24, 17],
  ['Sandwich, chicken', 'sandwich sarmie', '1 sandwich', 180, 350, 24, 34, 12],
  ['Bunny chow', 'bunny', '¼ loaf', 400, 780, 30, 95, 30],
  ['Curry with rice', 'curry', '1 plate', 400, 620, 28, 75, 22],
  ['Spaghetti bolognese', 'bolognese spag bol', '1 plate', 400, 600, 30, 70, 20],
  ['Lasagne', 'lasagna', '1 portion', 250, 400, 24, 32, 19],
  ['Stir fry', 'stirfry', '1 plate', 350, 450, 26, 45, 17],
  ['Sushi roll', 'sushi', '6 pieces', 160, 260, 9, 38, 7],
  ['Soup', 'vegetable soup', '1 bowl', 300, 160, 6, 22, 5],
  ['Stew', 'beef stew', '1 bowl', 300, 380, 28, 25, 18],
  ['Pie', 'chicken pie mince pie', '1 pie', 180, 520, 15, 40, 33],
  ['Samoosa', 'samosa', '1 piece', 50, 130, 3, 13, 7.5],
  ['Caesar salad', 'chicken salad', '1 bowl', 250, 380, 26, 12, 26],
  // snacks
  ['Almonds', 'nuts', '30 g', 30, 175, 6.4, 6, 15],
  ['Peanuts', '', '30 g', 30, 170, 7.3, 4.6, 14.6],
  ['Chips / crisps', 'crisps simba lays', 'small packet', 36, 190, 2.4, 19, 12],
  ['Popcorn', '', '3 cups', 24, 93, 3, 19, 1],
  ['Chocolate', 'chocolate bar', '1 bar (40 g)', 40, 215, 3, 24, 12.5],
  ['Biscuit / cookie', 'biscuit cookie rusk', '1 piece', 15, 70, 0.9, 10, 3],
  ['Rusk', 'ouma rusk', '1 rusk', 35, 150, 3, 22, 5.5],
  ['Muffin', '', '1 medium', 113, 420, 6, 57, 19],
  ['Cake slice', 'cake', '1 slice', 100, 370, 4.5, 50, 17],
  ['Ice cream', '', '1 scoop', 66, 137, 2.3, 16, 7.3],
  ['Doughnut', 'donut', '1 doughnut', 60, 250, 3.5, 29, 13.5],
  ['Protein bar', 'bar', '1 bar', 60, 220, 20, 22, 7],
  ['Rice cake', 'rice cakes', '1 cake', 9, 35, 0.7, 7.3, 0.3],
  // drinks
  ['Coffee, black', 'coffee espresso americano', '1 cup', 240, 2, 0.3, 0, 0],
  ['Coffee with milk', 'latte cappuccino flat white', '1 mug', 300, 130, 7, 10, 7],
  ['Tea with milk & sugar', 'tea rooibos', '1 cup', 250, 60, 1.5, 10, 1.5],
  ['Sugar', '', '1 tsp', 4, 16, 0, 4, 0],
  ['Coca-Cola', 'coke soda cooldrink soft drink fizzy', '1 can', 330, 139, 0, 35, 0],
  ['Orange juice', 'juice', '1 glass', 250, 112, 1.7, 26, 0.5],
  ['Beer', 'lager', '1 can', 340, 150, 1.6, 13, 0],
  ['Wine', 'red wine white wine', '1 glass', 150, 125, 0.1, 4, 0],
  ['Smoothie', '', '1 glass', 300, 200, 4, 42, 2],
  ['Energy drink', 'red bull monster', '1 can', 250, 113, 0, 28, 0],
  // cooking extras
  ['Olive oil', 'oil cooking oil', '1 tbsp', 14, 119, 0, 0, 13.5],
  ['Mayonnaise', 'mayo', '1 tbsp', 14, 94, 0.1, 0.1, 10.3],
  ['Tomato sauce / ketchup', 'ketchup tomato sauce', '1 tbsp', 17, 17, 0.2, 4.5, 0],
  ['Gravy', '', '¼ cup', 60, 30, 1, 4, 1.3],
  ['Chutney', 'mrs balls', '1 tbsp', 20, 40, 0, 10, 0],
];

export const FOODS = RAW.map(([n, a, s, g, k, p, c, f], i) => ({
  id: 'b' + i, name: n, aliases: (n + ' ' + a).toLowerCase(), serving: s, grams: g, kcal: k, protein: p, carbs: c, fat: f, src: 'builtin',
}));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function searchLocal(q, extra = []) {
  const query = norm(q);
  if (!query) return [];
  const words = query.split(' ');
  const pool = [...extra.map(f => ({ ...f, aliases: (f.name + ' ' + (f.aliases || '')).toLowerCase() })), ...FOODS];
  return pool
    .map(f => {
      const hay = norm(f.aliases);
      let score = 0;
      const name = norm(f.name);
      // "rice" should find white rice before rice cakes: only reward prefixes that cover most of the name
      if (name.startsWith(query) && query.length >= name.length * 0.6) score += 6;
      if (hay.includes(query)) score += 4;
      for (const w of words) if (w.length > 1 && hay.split(' ').some(h => h.startsWith(w))) score += 2;
      return { f, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(x => x.f);
}

// ---- offline description parser: "2 eggs, toast with butter and a coffee" ----
const NUMWORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, couple: 2, few: 3, some: 1, double: 2 };

export function estimateFromText(text, extra = []) {
  // keep "coffee with milk" whole when it's a known food, otherwise split "toast with butter"
  const chunks = text.toLowerCase().replace(/½/g, ' half ').split(/,|\band\b|\bplus\b|\+|&/).map(s => norm(s)).filter(Boolean)
    .flatMap(c => {
      if (!/\bwith\b/.test(c)) return [c];
      const whole = stripWords(c), hit = searchLocal(whole, extra)[0];
      return hit && norm(hit.aliases).includes(whole) ? [c] : c.split(/\bwith\b/).map(s => s.trim()).filter(Boolean);
    });
  const items = [];
  for (const chunk of chunks) {
    let qty = 1, grams = null;
    const g = chunk.match(/(\d+(?:\.\d+)?)\s*(g|grams?|ml)\b/);
    const n = chunk.match(/^(\d+(?:\.\d+)?)\b/) || chunk.match(/\b(\d+(?:\.\d+)?)\b/);
    if (g) grams = parseFloat(g[1]);
    else if (n) qty = parseFloat(n[1]);
    else { const w = chunk.split(' ').find(w => NUMWORDS[w] !== undefined); if (w) qty = NUMWORDS[w]; }
    const cleaned = stripWords(chunk);
    if (!cleaned) continue;
    const hit = searchLocal(cleaned, extra)[0];
    if (!hit) continue;
    const mult = grams ? grams / hit.grams : qty;
    items.push(scaleFood(hit, mult, grams ? `${grams} g` : `${fmtQty(qty)} × ${hit.serving}`));
  }
  return items;
}

const stripWords = (c) => c.replace(/\d+(\.\d+)?\s*(g|grams?|ml)?/g, '')
  .replace(/\b(a|an|one|two|three|four|five|six|half|couple|few|some|double|cup|cups|slice|slices|piece|pieces|bowl|plate|glass|small|large|big|medium|of|my|the)\b/g, ' ')
  .replace(/\s+/g, ' ').trim();
const fmtQty = (q) => (q === 0.5 ? '½' : String(+q.toFixed(2)));

export function scaleFood(f, mult, portion) {
  const r = (v) => Math.round(v * mult * 10) / 10;
  return {
    name: f.name, portion: portion || f.serving, grams: Math.round((f.grams || 0) * mult),
    kcal: Math.round(f.kcal * mult), protein: r(f.protein), carbs: r(f.carbs), fat: r(f.fat),
  };
}
