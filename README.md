# GivUsFree

Snap your food, know your calories. A simple, free calorie and health tracker for the family — no accounts, no payments, no ads.

**Get it:** open the download page at `https://gilliangertse438-ops.github.io/givusfree/download.html`

- **Android:** download `GivUsFree.apk` from the [latest release](../../releases/latest) and install it.
- **iPhone / iPad:** open the web app in Safari → Share → **Add to Home Screen**.

## What it does

- **Snap & count** — take a photo of your plate (and optionally describe it) and get calories, protein, carbs and fat per item. Adjust grams and everything updates.
- **Describe it instead** — type "2 eggs, toast with butter and a coffee" and get an estimate, even offline.
- **Food diary** — breakfast, lunch, dinner, snacks; copy yesterday's meal; log again in one tap.
- **Search** — 130+ built-in everyday foods plus millions of packaged products via Open Food Facts.
- **Barcode scanner** — scan packaged food.
- **Personal goals** — daily calories worked out from your body and goal (or set your own), diet styles (balanced, high protein, low carb, keto, low fat) or custom macro percentages.
- **Water, exercise and weight** — glasses of water, workouts that add to your budget, weight trend chart.
- **Progress** — 7-day chart, averages, logging streak, BMI and a monthly on-target calendar.
- **Family profiles** — everyone on a phone gets their own diary. Backup and restore to a file.
- kg/lb, cm/ft and kcal/kJ.

## Photo recognition (free)

Photo recognition uses Google's Gemini API, which has a free tier for personal use. Create a key once at <https://aistudio.google.com/apikey> and paste it in **Me → Photo AI** on each phone. The key stays on the phone. Without a key, describing meals in words still works.

## Privacy

All data is stored on the device (browser storage). Photos are only sent to Google when you analyse them, and barcodes/searches go to Open Food Facts.

## Development

The app is plain HTML/CSS/JavaScript in `app/` — no build step.

```bash
python -m http.server 5173 --directory app
```

- `.github/workflows/pages.yml` publishes `app/` to GitHub Pages on every push to `main`.
- `.github/workflows/android.yml` wraps `app/` with Capacitor, builds an APK and publishes it as the `android` release.

Calorie estimates are a guide, not medical advice.
