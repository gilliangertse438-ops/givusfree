// Photo → calories using Google's Gemini (free tier with a personal key),
// plus Open Food Facts for barcodes and branded products (free, no key).

const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

const PROMPT = (desc) => `You are a careful dietitian estimating the nutrition of a meal for a calorie-tracking app.
${desc ? `The person describes it as: "${desc}". Trust their description for ingredients, quantities and cooking method (oil, butter, sugar, sauces), and use the photo for portion size.` : 'Use only the photo.'}
Identify each distinct food or drink. Estimate the portion in grams using visual cues (plate ~26 cm, cutlery, hands, packaging). Include hidden calories such as cooking oil, dressings and sauces when they are likely.
Reply with JSON only, no markdown:
{"title":"short name for the whole meal","items":[{"name":"food","portion":"human portion e.g. 1 cup / 2 slices","grams":0,"kcal":0,"protein":0,"carbs":0,"fat":0}],"confidence":"low|medium|high","note":"one short, friendly, practical tip (max 20 words)"}
If there is no food in the image and no description, reply {"title":"","items":[],"confidence":"low","note":"I couldn't see any food."}`;

export async function analyzeMeal({ key, model, imageB64, description }) {
  const parts = [{ text: PROMPT(description?.trim()) }];
  if (imageB64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageB64 } });
  const body = JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } });
  const list = model ? [model, ...MODELS.filter(m => m !== model)] : MODELS;
  let lastErr;
  for (const m of list) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body,
      });
    } catch { throw new Error('No internet connection. Describe the meal in words and I\'ll estimate it offline.'); }
    if (res.status === 404) { lastErr = new Error('Model not available'); continue; }
    if (res.status === 400 || res.status === 403) {
      const j = await res.json().catch(() => ({}));
      const msg = j?.error?.message || '';
      if (/api key/i.test(msg)) throw new Error('That AI key was not accepted. Check it in Me → Photo AI.');
      throw new Error(msg || 'The AI could not read this photo.');
    }
    if (res.status === 429) throw new Error('The free AI limit was reached for now. Try again in a minute.');
    if (!res.ok) { lastErr = new Error('AI service error (' + res.status + ')'); continue; }
    const j = await res.json();
    const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return { ...clean(parseJSON(text)), model: m };
  }
  throw lastErr || new Error('AI unavailable');
}

function parseJSON(t) {
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  throw new Error('The AI answer was garbled. Please try again.');
}

const n = (v) => Math.max(0, Math.round((parseFloat(v) || 0) * 10) / 10);
function clean(r) {
  const items = (r.items || []).filter(i => i && i.name).map(i => ({
    name: String(i.name).slice(0, 60), portion: String(i.portion || '').slice(0, 40), grams: Math.round(n(i.grams)),
    kcal: Math.round(n(i.kcal)), protein: n(i.protein), carbs: n(i.carbs), fat: n(i.fat),
  }));
  return { title: String(r.title || items[0]?.name || 'Meal').slice(0, 60), items, confidence: r.confidence || 'medium', note: r.note || '' };
}

// ---------- Open Food Facts ----------
const OFF = 'https://world.openfoodfacts.org';
function offToFood(p) {
  const nm = p.nutriments || {};
  const per100 = { kcal: nm['energy-kcal_100g'] ?? (nm.energy_100g ? nm.energy_100g / 4.184 : null), protein: nm.proteins_100g || 0, carbs: nm.carbohydrates_100g || 0, fat: nm.fat_100g || 0 };
  if (per100.kcal == null) return null;
  const sg = parseFloat(p.serving_quantity) || 100;
  const f = sg / 100;
  return {
    id: 'off' + (p.code || p._id), name: [p.product_name, p.brands?.split(',')[0]].filter(Boolean).join(' · ') || 'Product',
    serving: p.serving_size || '100 g', grams: Math.round(sg), kcal: Math.round(per100.kcal * f),
    protein: +(per100.protein * f).toFixed(1), carbs: +(per100.carbs * f).toFixed(1), fat: +(per100.fat * f).toFixed(1), src: 'off',
  };
}
export async function lookupBarcode(code) {
  const r = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,serving_size,serving_quantity,nutriments`);
  const j = await r.json();
  if (j.status !== 1) return null;
  return offToFood(j.product);
}
export async function searchProducts(q, signal) {
  const r = await fetch(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=15&fields=code,product_name,brands,serving_size,serving_quantity,nutriments`, { signal });
  const j = await r.json();
  return (j.products || []).map(offToFood).filter(Boolean);
}

// ---------- images ----------
export function loadImage(file) {
  return new Promise((ok, bad) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => ok(img); img.onerror = () => bad(new Error('Could not open that image'));
    img.src = url;
  });
}
export function shrink(img, max, q = 0.82) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
export function squareThumb(img, size = 120) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const m = Math.min(img.naturalWidth, img.naturalHeight);
  c.getContext('2d').drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.6);
}
