import { Request, Response } from 'express';
import { db } from '../db/database';
import { supabase } from '../db/supabase';

export const foodController = {
  /**
   * Query global food database (Supabase food_items + standard registry)
   * Role-Based Projection:
   *  - Guests receive limited basic info (name, category, servingSize, calories only)
   *  - Registered/Admin users receive full macronutrient breakdown (protein, carbs, fiber, fats, sodium)
   */
  async getFoodItems(req: Request, res: Response): Promise<void> {
    try {
      const { search, category } = req.query;

      // 1. Query Supabase food_items table for persisted imports
      let sbItems: any[] = [];
      try {
        let query = supabase.from('food_items').select('*').order('created_at', { ascending: false });
        if (typeof search === 'string' && search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`);
        }
        if (typeof category === 'string' && category !== 'all') {
          query = query.eq('category', category);
        }
        const { data: sbData, error: sbErr } = await query;
        if (!sbErr && sbData) {
          sbItems = sbData.map((f: any) => ({
            _id: `sb_${f.id}`,
            id: `sb_${f.id}`,
            name: f.name,
            category: f.category || 'carbs',
            servingSize: '100g',
            calories: Number(f.calories || 0),
            proteinGrams: Number(f.protein || 0),
            carbsGrams: Number(f.carbs || 0),
            fatsGrams: Number(f.fats || 0),
            fiberGrams: Number(f.fiber || 0),
            publicNotes: f.preparation || 'Imported from Open Food Facts',
            isCustom: true,
            createdAt: f.created_at,
          }));
        }
      } catch (err: any) {
        console.warn('[FoodController] Supabase food_items fetch notice:', err.message);
      }

      // 2. Query built-in verified items
      const localItems = db.getFoodItems(
        typeof search === 'string' ? search : undefined,
        typeof category === 'string' ? category : undefined
      );

      // Merge Supabase persisted items first, followed by local database items
      const allItems = [...sbItems, ...localItems];

      const isAuthenticated = !!(req.user && (req.user.role === 'registered' || req.user.role === 'admin'));

      if (!isAuthenticated) {
        // Guest Tier: Restricted projection (no deep macro breakdown)
        const guestView = allItems.map((item) => ({
          _id: item._id,
          id: item.id,
          name: item.name,
          category: item.category,
          servingSize: item.servingSize,
          calories: item.calories,
          proteinGrams: null,
          carbsGrams: null,
          fatsGrams: null,
          fiberGrams: null,
          publicNotes: item.publicNotes || '',
          accessTier: 'guest',
        }));

        res.status(200).json({
          success: true,
          accessTier: 'guest',
          message: 'Limited nutritional info returned. Create a free account or log in to unlock complete protein, carb, fiber, and fat macro breakdowns.',
          count: guestView.length,
          data: guestView,
        });
        return;
      }

      // Registered/Admin Tier: Full comprehensive macronutrients & micronutrients
      res.status(200).json({
        success: true,
        accessTier: req.user?.role,
        message: 'Full macro and micronutrient breakdown unlocked.',
        count: allItems.length,
        data: allItems,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get specific food item by ID
   */
  async getFoodById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      let item: any = null;

      // Check if it is a Supabase food item
      if (id.startsWith('sb_')) {
        const rawId = Number(id.replace('sb_', ''));
        const { data, error } = await supabase.from('food_items').select('*').eq('id', rawId).maybeSingle();
        if (!error && data) {
          item = {
            _id: `sb_${data.id}`,
            id: `sb_${data.id}`,
            name: data.name,
            category: data.category || 'carbs',
            servingSize: '100g',
            calories: Number(data.calories || 0),
            proteinGrams: Number(data.protein || 0),
            carbsGrams: Number(data.carbs || 0),
            fatsGrams: Number(data.fats || 0),
            fiberGrams: Number(data.fiber || 0),
            publicNotes: data.preparation || 'Imported from Open Food Facts',
            isCustom: true,
          };
        }
      }

      if (!item) {
        item = db.getFoodById(id);
      }

      if (!item) {
        res.status(404).json({ success: false, error: 'Food item not found.' });
        return;
      }

      const isAuthenticated = !!(req.user && (req.user.role === 'registered' || req.user.role === 'admin'));

      if (!isAuthenticated) {
        res.status(200).json({
          success: true,
          accessTier: 'guest',
          notice: 'Full macros locked for guests. Register to view protein, fiber, carbs, and fats.',
          data: {
            _id: item._id,
            id: item.id,
            name: item.name,
            category: item.category,
            servingSize: item.servingSize,
            calories: item.calories,
            publicNotes: item.publicNotes,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        accessTier: req.user?.role,
        data: item,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Automated Open Food Facts Import Endpoint
   * Route: POST /api/import-foods or POST /api/food/import
   * Extracts per-100g baseline nutritional data (calories, protein, carbs, fats, fiber)
   * and saves records directly into the Supabase food_items table.
   */
  async importFoods(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.body?.searchTerm || req.body?.query || req.body?.search || req.query?.search;

      if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search term is required in the request body (e.g., { "searchTerm": "chicken breast" }).',
          code: 'MISSING_SEARCH_TERM',
        });
        return;
      }

      const cleanSearch = searchTerm.trim();
      const pageSize = req.body?.pageSize ? Math.min(Number(req.body.pageSize), 50) : 20;

      // Construct Open Food Facts search URL (v2 API preferred for speed and high availability)
      const offUrlV2 = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(cleanSearch)}&fields=product_name,product_name_en,generic_name,nutriments,categories_tags&page_size=${pageSize}`;
      const offUrlLegacy = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanSearch)}&search_simple=1&action=process&json=1&page_size=${pageSize}`;

      // User-Agent required by Open Food Facts usage policy
      const userAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT || 'LiftIt-FitnessApp/1.0 (https://liftit.app - fitness platform)';

      let offResponse = await fetch(offUrlV2, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
        },
      });

      // If transient rate-limit or temporary 503, wait briefly and retry
      if (!offResponse.ok && (offResponse.status === 503 || offResponse.status === 429)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        offResponse = await fetch(offUrlV2, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json',
          },
        });
      }

      // If v2 still fails or returns non-200, fallback to legacy CGI endpoint
      if (!offResponse.ok) {
        console.warn(`[Open Food Facts] v2 endpoint returned ${offResponse.status}, falling back to legacy endpoint...`);
        offResponse = await fetch(offUrlLegacy, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json',
          },
        });
      }

      if (!offResponse.ok) {
        res.status(502).json({
          success: false,
          error: `Open Food Facts API returned error status ${offResponse.status}: ${offResponse.statusText}`,
          code: 'OFF_UPSTREAM_ERROR',
        });
        return;
      }

      const offData: any = await offResponse.json();
      const products: any[] = offData.products || [];

      if (products.length === 0) {
        res.status(404).json({
          success: false,
          message: `No matching products found on Open Food Facts for '${cleanSearch}'.`,
          count: 0,
          data: [],
        });
        return;
      }

      const itemsToInsert: Array<{
        name: string;
        category: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
        preparation: string;
      }> = [];

      for (const product of products) {
        const productName = (product.product_name || product.product_name_en || product.generic_name || '').trim();
        if (!productName) continue;

        const nutriments = product.nutriments || {};

        // Fix the protein variable assignment bug:
        // Nutriments might have proteins_100g, proteins, or proteins_value, or be null/undefined.
        // We ensure a sanitized numerical float rounded to 1 decimal place and mapped to Supabase 'protein' column.
        const rawProtein = nutriments['proteins_100g'] ?? nutriments['proteins'] ?? nutriments['proteins_value'] ?? 0;
        const protein = Math.max(0, Math.round(Number(rawProtein) * 10) / 10 || 0);

        const rawCarbs = nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? nutriments['carbohydrates_value'] ?? 0;
        const carbs = Math.max(0, Math.round(Number(rawCarbs) * 10) / 10 || 0);

        const rawFats = nutriments['fat_100g'] ?? nutriments['fat'] ?? nutriments['fats'] ?? nutriments['fat_value'] ?? 0;
        const fats = Math.max(0, Math.round(Number(rawFats) * 10) / 10 || 0);

        const rawFiber = nutriments['fiber_100g'] ?? nutriments['fiber'] ?? nutriments['fiber_value'] ?? 0;
        const fiber = Math.max(0, Math.round(Number(rawFiber) * 10) / 10 || 0);

        // Per-100g baseline calories calculation:
        // Priority 1: energy-kcal_100g
        // Priority 2: energy-kcal
        // Priority 3: energy_100g in kJ converted to kcal (divide by 4.184)
        // Fallback: Standard Atwater 4/4/9 macronutrient factor calculation
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

        // Infer macro category based on dominant macronutrient and tags
        let category = 'carbs';
        if (protein >= carbs && protein >= fats && protein > 5) {
          category = 'protein';
        } else if (fats > carbs && fats > protein && fats > 10) {
          category = 'fats';
        } else if (carbs > protein && carbs > fats) {
          category = 'carbs';
        } else if (product.categories_tags && Array.isArray(product.categories_tags)) {
          const tagsStr = product.categories_tags.join(' ').toLowerCase();
          if (tagsStr.includes('meat') || tagsStr.includes('poultry') || tagsStr.includes('fish') || tagsStr.includes('egg')) {
            category = 'protein';
          } else if (tagsStr.includes('fruit') || tagsStr.includes('vegetable')) {
            category = 'vegetable';
          } else if (tagsStr.includes('dairy') || tagsStr.includes('cheese') || tagsStr.includes('milk')) {
            category = 'dairy';
          }
        }

        // Avoid products that lack all macronutrient info
        if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
          continue;
        }

        itemsToInsert.push({
          name: productName.slice(0, 150),
          category,
          calories,
          protein,
          carbs,
          fats,
          fiber,
          preparation: 'Commercial/Packaged',
        });
      }

      if (itemsToInsert.length === 0) {
        res.status(422).json({
          success: false,
          error: `No valid nutritional data found in products for '${cleanSearch}'.`,
          code: 'NO_VALID_NUTRITION_DATA',
        });
        return;
      }

      // Insert directly into Supabase 'food_items' table
      const { data: inserted, error: sbError } = await supabase
        .from('food_items')
        .insert(itemsToInsert)
        .select();

      if (sbError) {
        console.error('[Supabase Import Error]:', sbError.message);
        res.status(500).json({
          success: false,
          error: `Failed to insert food items into Supabase: ${sbError.message}`,
          code: 'DATABASE_INSERT_ERROR',
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${inserted?.length || 0} food items into Supabase.`,
        searchTerm: cleanSearch,
        importedCount: inserted?.length || 0,
        data: inserted,
      });
    } catch (error: any) {
      console.error('[Import Foods Exception]:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An error occurred while importing food items from Open Food Facts.',
        code: 'IMPORT_EXCEPTION',
      });
    }
  },
};
