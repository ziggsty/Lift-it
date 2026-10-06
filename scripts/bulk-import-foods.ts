import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gscqhrruuuxkrgbaoajl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3FocnJ1dXV4a3JnYmFvYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODE5NTUsImV4cCI6MjEwNjY1Nzk1NX0.k4fwjGWvLOkQQmPtDw7Gj5e3iGKXr9Dneunu_zzXtFk';
const USER_AGENT = process.env.OPEN_FOOD_FACTS_USER_AGENT || 'LiftIt-FitnessApp/1.0 (https://liftit.app - fitness and nutrition platform)';

// Default fitness staple queries if none provided via CLI
const DEFAULT_SEARCH_TERMS = [
  // Poultry & Meat
  'chicken breast',
  'chicken thigh',
  'pork tenderloin',
  'lean ground beef',
  'beef steak',
  'turkey breast',

  // Fish & Seafood
  'salmon fillet',
  'tuna canned in water',
  'tilapia fillet',
  'shrimp',

  // Eggs & Dairy
  'eggs whole',
  'egg whites',
  'greek yogurt',
  'cottage cheese',
  'whey protein isolate',

  // Grains & Starches
  'white rice',
  'brown rice',
  'rolled oats',
  'sweet potato',
  'quinoa',
  'whole wheat pasta',

  // Legumes & Healthy Fats
  'black beans',
  'chickpeas',
  'lentils',
  'peanut butter',
  'almonds',

  // Vegetables & Fruits
  'broccoli',
  'spinach',
  'banana',
  'blueberries',
];

// Verified baseline fitness staples (USDA / Standard 100g Nutrition)
// Can be loaded via --seed flag or used when Open Food Facts API has downtime
const VERIFIED_FITNESS_STAPLES: FoodItemRow[] = [
  { name: 'Boneless Skinless Chicken Breast (Raw)', category: 'protein', calories: 120, protein: 22.5, carbs: 0, fats: 2.6, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Chicken Thigh Meat (Skinless, Raw)', category: 'protein', calories: 133, protein: 20.0, carbs: 0, fats: 5.7, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Pork Tenderloin (Lean, Raw)', category: 'protein', calories: 120, protein: 22.0, carbs: 0, fats: 3.5, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Lean Ground Beef (93/7, Raw)', category: 'protein', calories: 152, protein: 21.0, carbs: 0, fats: 7.5, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Top Sirloin Beef Steak (Lean)', category: 'protein', calories: 142, protein: 23.0, carbs: 0, fats: 5.4, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Atlantic Salmon Fillet (Raw)', category: 'protein', calories: 208, protein: 20.4, carbs: 0, fats: 13.4, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Yellowfin Tuna Steak (Raw)', category: 'protein', calories: 109, protein: 24.4, carbs: 0, fats: 0.5, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Tilapia Fillet (Raw)', category: 'protein', calories: 96, protein: 20.1, carbs: 0, fats: 1.7, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Large Whole Eggs (Fresh)', category: 'protein', calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5, fiber: 0, preparation: 'Raw/Whole' },
  { name: 'Liquid Egg Whites (100% Pure)', category: 'protein', calories: 52, protein: 10.9, carbs: 0.7, fats: 0.2, fiber: 0, preparation: 'Commercial/Packaged' },
  { name: 'Non-Fat Plain Greek Yogurt', category: 'dairy', calories: 59, protein: 10.3, carbs: 3.6, fats: 0.4, fiber: 0, preparation: 'Commercial/Packaged' },
  { name: 'Low-Fat Cottage Cheese (2%)', category: 'dairy', calories: 86, protein: 11.8, carbs: 4.3, fats: 2.3, fiber: 0, preparation: 'Commercial/Packaged' },
  { name: '100% Whey Protein Isolate Powder', category: 'protein', calories: 375, protein: 87.5, carbs: 2.5, fats: 1.2, fiber: 0, preparation: 'Commercial/Packaged' },
  { name: 'Jasmine White Rice (Dry)', category: 'carbs', calories: 365, protein: 7.1, carbs: 80.0, fats: 0.7, fiber: 1.3, preparation: 'Raw/Whole' },
  { name: 'Whole Grain Brown Rice (Dry)', category: 'carbs', calories: 370, protein: 7.9, carbs: 77.2, fats: 2.9, fiber: 3.5, preparation: 'Raw/Whole' },
  { name: 'Whole Rolled Oats (Dry)', category: 'carbs', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, fiber: 10.6, preparation: 'Raw/Whole' },
  { name: 'Sweet Potato (Raw, Unpeeled)', category: 'carbs', calories: 86, protein: 1.6, carbs: 20.1, fats: 0.1, fiber: 3.0, preparation: 'Raw/Whole' },
  { name: 'Black Beans (Cooked/Boiled)', category: 'carbs', calories: 132, protein: 8.9, carbs: 23.7, fats: 0.5, fiber: 8.7, preparation: 'Cooked/Prepared' },
  { name: 'Natural Creamy Peanut Butter', category: 'fats', calories: 588, protein: 25.1, carbs: 20.0, fats: 50.4, fiber: 6.0, preparation: 'Commercial/Packaged' },
  { name: 'Fresh Raw Broccoli Florets', category: 'vegetable', calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4, fiber: 2.6, preparation: 'Raw/Whole' },
  { name: 'Fresh Baby Spinach Leaves', category: 'vegetable', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, preparation: 'Raw/Whole' },
  { name: 'Fresh Whole Banana (Cavendish)', category: 'fruit', calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6, preparation: 'Raw/Whole' },
];

interface FoodItemRow {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  preparation: string;
}

// Utility: Sleep between network requests
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBulkImport() {
  console.log('\n===============================================================');
  console.log('       🏋️  LIFT IT - BULK FOOD DATABASE IMPORTER  🏋️');
  console.log('===============================================================\n');

  console.log(`[Config] Supabase Target:     ${SUPABASE_URL}`);
  console.log(`[Config] Open Food Facts UA:  ${USER_AGENT}`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  let customQuery: string | null = null;
  let itemsPerTerm = 4;
  let isDryRun = false;
  let seedMode = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--query' && args[i + 1]) {
      customQuery = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      itemsPerTerm = Math.max(1, Math.min(20, parseInt(args[i + 1], 10) || 4));
      i++;
    } else if (args[i] === '--dry-run') {
      isDryRun = true;
    } else if (args[i] === '--seed') {
      seedMode = true;
    }
  }

  const termsToQuery = customQuery ? [customQuery] : DEFAULT_SEARCH_TERMS;
  console.log(`[Config] Total Terms:         ${termsToQuery.length}`);
  console.log(`[Config] Items per Term:      ${itemsPerTerm}`);
  console.log(`[Config] Seed Staples Mode:   ${seedMode ? 'ENABLED (Direct Verified Seeding)' : 'OFF'}`);
  console.log(`[Config] Dry Run Mode:        ${isDryRun ? 'ENABLED (No DB writes)' : 'DISABLED (Writing to Supabase)'}\n`);

  // Initialize Supabase Client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify connection to Supabase and food_items table
  console.log('⏳ Connecting to Supabase and checking existing food items...');
  const { data: initialData, error: tableError } = await supabase
    .from('food_items')
    .select('id, name')
    .limit(1000);

  if (tableError) {
    console.error('\n❌ Error accessing Supabase food_items table:');
    console.error(`   Message: ${tableError.message}`);
    console.error(`   Code:    ${tableError.code}`);
    console.error('\nPlease verify your SUPABASE_URL and SUPABASE_KEY in your .env file.');
    process.exit(1);
  }

  const existingNames = new Set<string>();
  if (initialData) {
    for (const row of initialData) {
      if (row.name) existingNames.add(row.name.trim().toLowerCase());
    }
  }
  console.log(`✅ Supabase connected. Found ${existingNames.size} existing food item(s) in database.\n`);

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const startTime = Date.now();

  // If --seed mode is requested, insert verified fitness staple foods
  if (seedMode) {
    console.log('📦 Processing Verified Fitness Staples Seeding...');
    const staplesToInsert: FoodItemRow[] = [];

    for (const staple of VERIFIED_FITNESS_STAPLES) {
      if (existingNames.has(staple.name.toLowerCase())) {
        totalSkipped++;
        continue;
      }
      staplesToInsert.push(staple);
      existingNames.add(staple.name.toLowerCase());
    }

    if (staplesToInsert.length > 0) {
      if (!isDryRun) {
        const { data: inserted, error: insErr } = await supabase
          .from('food_items')
          .insert(staplesToInsert)
          .select();

        if (insErr) {
          console.error(`❌ Failed to insert verified staples: ${insErr.message}`);
        } else {
          totalInserted += inserted.length;
          console.log(`✅ Successfully seeded ${inserted.length} fitness staple foods into Supabase:`);
          for (const item of inserted) {
            console.log(`   • ${item.name} (${item.calories} kcal | P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fats}g per 100g)`);
          }
        }
      } else {
        totalInserted += staplesToInsert.length;
        console.log(`[Dry Run] Would seed ${staplesToInsert.length} staple foods.`);
      }
    } else {
      console.log('ℹ️  All verified fitness staples already exist in your database.');
    }
  } else {
    // Iterate over each food search term querying Open Food Facts
    for (let idx = 0; idx < termsToQuery.length; idx++) {
    const term = termsToQuery[idx];
    const progressLabel = `[${idx + 1}/${termsToQuery.length}]`;
    console.log(`${progressLabel} Querying Open Food Facts for "${term}"...`);

    const offUrlV2 = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(term)}&fields=product_name,product_name_en,generic_name,nutriments,categories_tags&page_size=${itemsPerTerm * 2}`;
    const offUrlLegacy = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=${itemsPerTerm * 2}`;

    let response: any = null;
    let products: any[] = [];

    try {
      // Primary attempt: modern v2 API
      let res = await fetch(offUrlV2, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      });

      // Transient 503 / 429 backoff retry
      if (!res.ok && (res.status === 503 || res.status === 429)) {
        await sleep(1000);
        res = await fetch(offUrlV2, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        });
      }

      // Fallback to legacy endpoint if v2 fails
      if (!res.ok) {
        res = await fetch(offUrlLegacy, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        });
      }

      if (res.ok) {
        response = await res.json();
        products = response.products || [];
      } else {
        console.warn(`   ⚠️  Open Food Facts HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Network error querying "${term}": ${err.message}`);
    }

    if (products.length === 0) {
      console.log(`   ℹ️  No products returned for "${term}".`);
      await sleep(600);
      continue;
    }

    totalFetched += products.length;

    // Filter and sanitize per-100g nutritional baseline
    const batchToInsert: FoodItemRow[] = [];

    for (const p of products) {
      if (batchToInsert.length >= itemsPerTerm) break;

      const rawName = (p.product_name || p.product_name_en || p.generic_name || '').trim();
      if (!rawName || rawName.length < 3) continue;

      const lowerName = rawName.toLowerCase();
      // Skip if already in database or in current batch
      if (existingNames.has(lowerName)) {
        totalSkipped++;
        continue;
      }

      const nutriments = p.nutriments || {};

      // =========================================================================
      // FIX: Protein Variable Assignment Bug & Per-100g Baseline Normalization
      // Coalesce 'proteins_100g', 'proteins', or 'proteins_value', ensure finite float,
      // clamp >= 0, round to 1 decimal place, and map to column 'protein' (singular).
      // =========================================================================
      const rawProtein = nutriments['proteins_100g'] ?? nutriments['proteins'] ?? nutriments['proteins_value'] ?? 0;
      const protein = Math.max(0, Math.round(Number(rawProtein) * 10) / 10 || 0);

      const rawCarbs = nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? nutriments['carbohydrates_value'] ?? 0;
      const carbs = Math.max(0, Math.round(Number(rawCarbs) * 10) / 10 || 0);

      const rawFats = nutriments['fat_100g'] ?? nutriments['fat'] ?? nutriments['fats'] ?? nutriments['fat_value'] ?? 0;
      const fats = Math.max(0, Math.round(Number(rawFats) * 10) / 10 || 0);

      const rawFiber = nutriments['fiber_100g'] ?? nutriments['fiber'] ?? nutriments['fiber_value'] ?? 0;
      const fiber = Math.max(0, Math.round(Number(rawFiber) * 10) / 10 || 0);

      // Calorie calculation with Atwater 4/4/9 fallback
      let calories = 0;
      if (nutriments['energy-kcal_100g'] !== undefined && !isNaN(Number(nutriments['energy-kcal_100g']))) {
        calories = Math.round(Number(nutriments['energy-kcal_100g']));
      } else if (nutriments['energy-kcal'] !== undefined && !isNaN(Number(nutriments['energy-kcal']))) {
        calories = Math.round(Number(nutriments['energy-kcal']));
      } else if (nutriments['energy_100g'] !== undefined && !isNaN(Number(nutriments['energy_100g']))) {
        calories = Math.round(Number(nutriments['energy_100g']) / 4.184);
      } else {
        calories = Math.round(protein * 4 + carbs * 4 + fats * 9);
      }
      calories = Math.max(0, calories);

      // Discard empty records with no nutritional values
      if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
        continue;
      }

      // Infer category
      let category = 'carbs';
      if (protein >= carbs && protein >= fats && protein > 5) {
        category = 'protein';
      } else if (fats > carbs && fats > protein && fats > 10) {
        category = 'fats';
      } else if (carbs > protein && carbs > fats) {
        category = 'carbs';
      } else if (p.categories_tags && Array.isArray(p.categories_tags)) {
        const tagStr = p.categories_tags.join(' ').toLowerCase();
        if (tagStr.includes('meat') || tagStr.includes('poultry') || tagStr.includes('fish') || tagStr.includes('egg')) {
          category = 'protein';
        } else if (tagStr.includes('fruit') || tagStr.includes('vegetable')) {
          category = 'vegetable';
        } else if (tagStr.includes('dairy') || tagStr.includes('cheese') || tagStr.includes('milk') || tagStr.includes('yogurt')) {
          category = 'dairy';
        }
      }

      batchToInsert.push({
        name: rawName.slice(0, 150),
        category,
        calories,
        protein,
        carbs,
        fats,
        fiber,
        preparation: 'Commercial/Packaged',
      });

      existingNames.add(lowerName);
    }

    if (batchToInsert.length > 0) {
      if (!isDryRun) {
        const { data: inserted, error: insErr } = await supabase
          .from('food_items')
          .insert(batchToInsert)
          .select();

        if (insErr) {
          console.error(`   ❌ Failed to insert into Supabase: ${insErr.message}`);
        } else {
          totalInserted += inserted.length;
          console.log(`   ✅ Inserted ${inserted.length} item(s):`);
          for (const item of inserted) {
            console.log(`      • ${item.name} (${item.calories} kcal | P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fats}g per 100g)`);
          }
        }
      } else {
        totalInserted += batchToInsert.length;
        console.log(`   [Dry Run] Would insert ${batchToInsert.length} item(s):`);
        for (const item of batchToInsert) {
          console.log(`      • ${item.name} (${item.calories} kcal | P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fats}g per 100g)`);
        }
      }
    } else {
      console.log(`   ℹ️  All retrieved items for "${term}" already existed or lacked nutritional metrics.`);
    }

    // Rate-limiting delay to respect Open Food Facts servers
    await sleep(750);
  }
}

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Final summary statistics
  console.log('\n===============================================================');
  console.log('                 📊  IMPORT SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`Terms Processed:       ${termsToQuery.length}`);
  console.log(`Raw Products Fetched:  ${totalFetched}`);
  console.log(`New Foods Inserted:    ${totalInserted}`);
  console.log(`Duplicates Skipped:    ${totalSkipped}`);
  console.log(`Total In Database:     ${existingNames.size}`);
  console.log(`Elapsed Time:          ${durationSec}s`);
  console.log('===============================================================\n');

  if (totalInserted > 0) {
    console.log('🎉 Bulk import complete! Open your Lift It app (Meals tab) to see your newly imported foods ready for live autocomplete and portion scaling.\n');
  } else {
    console.log('✨ All food items were already present in your Supabase database!\n');
  }

  process.exit(0);
}

runBulkImport().catch((err) => {
  console.error('\n💥 Fatal bulk-import error:', err);
  process.exit(1);
});
