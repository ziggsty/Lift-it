import React, { useState, useEffect, useRef } from 'react';
import { Utensils, PieChart, Search, Plus, Trash2, Lock, Unlock, AlertTriangle, Check, Flame, ExternalLink, X, Clock, Calendar, Download, Scale, Sparkles, RotateCcw } from 'lucide-react';
import { MealItem, FoodItem, DailyNutritionSummary, UserRole } from '../types';
import { api } from '../services/api';

interface BaseNutrition100g {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  category?: string;
}

interface MealTabProps {
  currentRole: UserRole;
  onOpenAuth: () => void;
}

export const MealTab: React.FC<MealTabProps> = ({ currentRole, onOpenAuth }) => {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [foodAccessTier, setFoodAccessTier] = useState<string>('guest');
  const [foodNotice, setFoodNotice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Pop-up modal states
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<MealItem | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');

  // Form states
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [weightGrams, setWeightGrams] = useState<number>(100);
  const [baseFood, setBaseFood] = useState<BaseNutrition100g | null>(null);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearchingFood, setIsSearchingFood] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);

  const [calories, setCalories] = useState(550);
  const [protein, setProtein] = useState(45);
  const [carbs, setCarbs] = useState(50);
  const [fiber, setFiber] = useState(6);
  const [fats, setFats] = useState(14);
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [importingFood, setImportingFood] = useState(false);

  // Close autocomplete dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Standard per-100g macro recalculation formula:
  // Final Nutrient = Base (per 100g) * (User Input Grams / 100)
  const recalculateMacros = (base: BaseNutrition100g, grams: number) => {
    const safeGrams = Math.max(0, grams);
    const ratio = safeGrams / 100;

    const calcCalories = Math.round(base.calories * ratio);
    const calcProtein = Math.round(base.protein * ratio * 10) / 10;
    const calcCarbs = Math.round(base.carbs * ratio * 10) / 10;
    const calcFats = Math.round(base.fats * ratio * 10) / 10;
    const calcFiber = Math.round(base.fiber * ratio * 10) / 10;

    setCalories(calcCalories);
    setProtein(calcProtein);
    setCarbs(calcCarbs);
    setFats(calcFats);
    setFiber(calcFiber);
  };

  const handleWeightGramsChange = (newGrams: number) => {
    const valid = isNaN(newGrams) ? 0 : Math.max(0, newGrams);
    setWeightGrams(valid);
    if (baseFood) {
      recalculateMacros(baseFood, valid);
    }
  };

  const handleMealNameChange = (val: string) => {
    setMealName(val);

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingFood(true);
      try {
        const { response, status } = await api.request('GET', `/api/food?search=${encodeURIComponent(val.trim())}`);
        if (status === 200 && response.success && Array.isArray(response.data)) {
          setSuggestions(response.data.slice(0, 8));
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingFood(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = (item: FoodItem) => {
    setMealName(item.name);
    const base: BaseNutrition100g = {
      name: item.name,
      calories: Number(item.calories || 0),
      protein: Number(item.proteinGrams ?? 0),
      carbs: Number(item.carbsGrams ?? 0),
      fats: Number(item.fatsGrams ?? 0),
      fiber: Number(item.fiberGrams ?? 0),
      category: item.category,
    };
    setBaseFood(base);
    setShowSuggestions(false);
    recalculateMacros(base, weightGrams);
  };

  const handleResetBaseline = () => {
    setBaseFood(null);
  };

  const handleImportOpenFoodFacts = async () => {
    const term = searchQuery.trim() || 'salmon';
    setImportingFood(true);
    setStatusMsg(null);
    try {
      const { response, status } = await api.request('POST', '/api/import-foods', { searchTerm: term, pageSize: 6 });
      if (status >= 200 && status < 300 && response.success) {
        setStatusMsg({
          text: `Imported ${response.importedCount || 0} product(s) for "${term}" into Supabase food database!`,
          type: 'success',
        });
        fetchFoodDatabase();
      } else {
        setStatusMsg({
          text: response.error || 'Failed to import from Open Food Facts',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setImportingFood(false);
    }
  };

  const fetchMealData = async () => {
    setLoading(true);

    // Fetch user meals history with formatted dates and macro ratios
    const historyRes = await api.request('GET', '/api/meals/history');
    if (historyRes.status === 200 && historyRes.response.success) {
      setMeals(historyRes.response.data || []);
      setHistorySummary(historyRes.response.summary || null);
    } else {
      // Fallback to basic /api/meals
      const mealRes = await api.request('GET', '/api/meals');
      if (mealRes.status === 200 && mealRes.response.success) {
        setMeals(mealRes.response.data || []);
      } else {
        setMeals([]);
      }
      setHistorySummary(null);
    }

    // Fetch summary
    const summaryRes = await api.request('GET', '/api/meals/summary');
    if (summaryRes.status === 200 && summaryRes.response.success) {
      setSummary(summaryRes.response as unknown as DailyNutritionSummary);
    } else {
      setSummary(null);
    }

    // Fetch food database
    fetchFoodDatabase();
    setLoading(false);
  };

  const fetchFoodDatabase = async (q?: string, cat?: string) => {
    const query = q !== undefined ? q : searchQuery;
    const category = cat !== undefined ? cat : categoryFilter;
    const url = `/api/food?search=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;

    const res = await api.request('GET', url);
    if (res.status === 200 && res.response.success) {
      setFoodItems(res.response.data || []);
      setFoodAccessTier(res.response.accessTier || 'guest');
      setFoodNotice(res.response.message || '');
    }
  };

  useEffect(() => {
    fetchMealData();
  }, [currentRole]);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (currentRole === 'guest') {
      setStatusMsg({
        text: 'Tier Notice: Full meal logging and macronutrient tracking requires an account. Please sign in or register free.',
        type: 'error',
      });
      onOpenAuth();
      return;
    }

    const payload = {
      mealName,
      mealType,
      calories: Number(calories),
      proteinGrams: Number(protein),
      carbsGrams: Number(carbs),
      fiberGrams: Number(fiber),
      fatsGrams: Number(fats),
      notes,
      timestamp: new Date().toISOString(),
    };

    const { response, status } = await api.request('POST', '/api/meals', payload);

    if (status === 201 && response.success) {
      setStatusMsg({ text: 'Meal recorded into nutritional registry!', type: 'success' });
      setMealName('');
      setNotes('');
      fetchMealData();
    } else {
      setStatusMsg({
        text: response.error || `Failed to log meal (HTTP ${status})`,
        type: 'error',
      });
    }
  };

  const handleDeleteMeal = async (id: string) => {
    const { response, status } = await api.request('DELETE', `/api/meals/${id}`);
    if (status === 200 && response.success) {
      setMeals((prev) => prev.filter((m) => m.id !== id && m._id !== id));
      fetchMealData();
    }
  };

  const handleQuickAddFood = (food: FoodItem) => {
    setMealName(food.name);
    const base: BaseNutrition100g = {
      name: food.name,
      calories: Number(food.calories || 0),
      protein: Number(food.proteinGrams ?? 0),
      carbs: Number(food.carbsGrams ?? 0),
      fats: Number(food.fatsGrams ?? 0),
      fiber: Number(food.fiberGrams ?? 0),
      category: food.category,
    };
    setBaseFood(base);
    setWeightGrams(100);
    recalculateMacros(base, 100);
    setStatusMsg({
      text: currentRole === 'guest'
        ? `Loaded "${food.name}" into food lookup (${food.calories} kcal baseline). Adjust portion grams to scale calories!`
        : `Loaded "${food.name}" into meal logger (100g baseline). Adjust grams to scale macros!`,
      type: 'success',
    });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* RBAC Notice if Guest */}
      {currentRole === 'guest' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Tier Restriction: Guest Food Lookup vs Full Macro Logging
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Guests can view calorie counts in the global database below. Deep macronutrient breakdowns (protein, carbs, fats, fiber) and personalized meal logs require a Registered Athlete account.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0 transition"
          >
            Register Free
          </button>
        </div>
      )}

      {/* Header / Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Utensils className="w-7 h-7 text-emerald-400" />
            Meal &amp; Macronutrient Architecture
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Precision daily energy tracking: calories, protein, fiber, carbohydrates, and fats with RBAC field projections.
          </p>
        </div>

        {(historySummary || meals.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Total Energy</div>
              <div className="text-sm font-black text-orange-400">
                {historySummary?.totalCaloriesLogged || summary?.totals.calories || 0} kcal
              </div>
            </div>
            <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Logged Meals</div>
              <div className="text-sm font-black text-white">
                {historySummary?.totalMealsLogged || meals.length}
              </div>
            </div>
            <button
              onClick={() => setShowAllHistoryModal(true)}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Pop-up History
            </button>
          </div>
        )}
      </div>

      {/* Daily Progress Bars */}
      {summary && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Today's Macronutrient Distribution
              </h3>
            </div>
            <span className="text-xs text-zinc-400">
              {summary.loggedMealsCount} meal(s) logged today
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Calories</span>
              <div className="text-xl font-black text-white mt-1">
                {summary.totals.calories} <span className="text-xs font-normal text-zinc-500">/ {summary.targets.calories} kcal</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.progress.caloriePercent)}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Protein</span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {summary.totals.proteinGrams}g <span className="text-xs font-normal text-zinc-500">/ {summary.targets.proteinGrams}g</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.progress.proteinPercent)}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Carbs</span>
              <div className="text-xl font-black text-amber-400 mt-1">
                {summary.totals.carbsGrams}g
              </div>
              <div className="text-[10px] text-zinc-500 mt-2 font-medium">
                {summary.macroPercentages.carbs}% of macros
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block">Fats</span>
              <div className="text-xl font-black text-indigo-400 mt-1">
                {summary.totals.fatsGrams}g
              </div>
              <div className="text-[10px] text-zinc-500 mt-2 font-medium">
                {summary.macroPercentages.fats}% of macros
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block">Fiber</span>
              <div className="text-xl font-black text-cyan-400 mt-1">
                {summary.totals.fiberGrams}g
              </div>
              <div className="text-[10px] text-zinc-500 mt-2 font-medium">
                Target: &gt;28g daily
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Meal Logger & Meal Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Logger Form */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Meal &amp; Nutrients</h3>
              <p className="text-xs text-zinc-400">Add food item to your daily macronutrient ledger</p>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleLogMeal} className="space-y-4">
            {/* Searchable Autocomplete Food Input */}
            <div ref={autocompleteContainerRef} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Meal / Food Name
                </label>
                <span className="text-[11px] text-zinc-400">
                  Type to search Supabase database
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 'chi' for Chicken, Oats, Salmon..."
                  value={mealName}
                  onChange={(e) => handleMealNameChange(e.target.value)}
                  onFocus={() => {
                    if (mealName.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                  autoComplete="off"
                />
                {isSearchingFood && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-zinc-800/80">
                  <div className="px-3 py-1.5 bg-zinc-950/80 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Database Matches (Select to scale)</span>
                    <span>100g Baseline</span>
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id || item._id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-zinc-800/70 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {currentRole === 'guest' ? (
                            <span className="text-zinc-500 font-mono">
                              {item.calories} kcal <span className="text-[10px] text-amber-400 font-sans ml-1">• Macros locked for guest</span>
                            </span>
                          ) : (
                            <span>
                              {item.calories} kcal • {item.proteinGrams ?? 0}g P • {item.carbsGrams ?? 0}g C • {item.fatsGrams ?? 0}g F
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition shrink-0 flex items-center gap-1">
                        Select <Plus className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grams Weight Input & Portion Presets */}
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  Portion Weight (grams)
                </label>
                {baseFood ? (
                  <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Base × ({weightGrams}g / 100)
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    Standard 100g unit
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[120px]">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={weightGrams}
                    onChange={(e) => handleWeightGramsChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-500 font-semibold pointer-events-none">
                    grams
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {[50, 100, 150, 200, 250].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handleWeightGramsChange(preset)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                        weightGrams === preset
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {preset}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Baseline Feedback Banner */}
              {baseFood && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="truncate pr-2">
                    <span className="text-zinc-500">Baseline (100g):</span>{' '}
                    {currentRole === 'guest' ? (
                      <span className="text-emerald-400 font-medium">
                        {baseFood.calories} kcal (Energy only • Macros restricted)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">
                        {baseFood.calories} kcal • {baseFood.protein}g P • {baseFood.carbs}g C • {baseFood.fats}g F
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleResetBaseline}
                    className="text-zinc-400 hover:text-zinc-200 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                    title="Clear baseline link to edit macros freely"
                  >
                    <RotateCcw className="w-3 h-3" /> Unlink
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Meal Category</label>
                <select
                  value={mealType}
                  onChange={(e: any) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Total Calories (kcal)</span>
                  {currentRole === 'guest' && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Calories Only Access
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-sm text-white focus:outline-none font-bold ${
                    currentRole === 'guest'
                      ? 'border-emerald-500/50 text-orange-400 focus:border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'border-zinc-800 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* RBAC Conditional Macro Fields: Hidden/Restricted for Guests, Full for Registered & Admins */}
            {currentRole === 'guest' ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Macronutrient Inputs Locked (Guest Role)
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    RBAC Restricted
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Input fields and detailed breakdowns for <strong>Protein (g)</strong>, <strong>Carbohydrates (g)</strong>, <strong>Fats (g)</strong>, and <strong>Dietary Fiber (g)</strong> are disabled and hidden for unauthenticated guests.
                </p>
                <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <span className="text-zinc-500">
                    Guests interact with <strong>Total Calories (kcal)</strong> only.
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    Register Free to Log Full Macros →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-emerald-400 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={protein}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-400 mb-1">Carbohydrates (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-indigo-400 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={fats}
                      onChange={(e) => setFats(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cyan-400 mb-1">Dietary Fiber (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={fiber}
                      onChange={(e) => setFiber(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Nutritional Notes / Ingredients</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 150g chicken breast, 1 cup brown rice..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                currentRole === 'guest'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {currentRole === 'guest' ? (
                <>
                  <Lock className="w-4 h-4" />
                  Register / Sign In to Log Full Meal
                </>
              ) : (
                <>
                  <Utensils className="w-4 h-4" />
                  Save Meal Log
                </>
              )}
            </button>
          </form>
        </div>

        {/* Logged Meals List */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Logged Meals Registry</h3>
                <p className="text-xs text-zinc-400">Click any meal to open nutritional telemetry &amp; macro breakdown</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllHistoryModal(true)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition flex items-center gap-1.5"
                  title="Open full history modal"
                >
                  <ExternalLink className="w-3 h-3" />
                  Pop-up History
                </button>
                <button
                  onClick={fetchMealData}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
                  title="Refresh meal records"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500">Retrieving meal records...</div>
            ) : meals.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                {currentRole === 'guest'
                  ? 'Meal logs are private to registered users. Please log in or register.'
                  : 'No meals logged yet. Log your first meal or select from the database below!'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {meals.map((m) => (
                  <div
                    key={m._id || m.id}
                    onClick={() => setActiveModalItem(m)}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between group hover:border-emerald-500/50 hover:bg-zinc-900/60 cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {m.mealType}
                        </span>
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition">{m.mealName}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                        <span className="font-bold text-orange-400">{m.calories} kcal</span>
                        {currentRole === 'guest' ? (
                          <span className="text-zinc-500 text-[11px] flex items-center gap-1 font-sans">
                            <Lock className="w-3 h-3 text-amber-400" /> Macros restricted
                          </span>
                        ) : (
                          <>
                            <span className="text-emerald-400 font-semibold">P: {m.proteinGrams}g</span>
                            <span className="text-amber-400 font-semibold">C: {m.carbsGrams}g</span>
                            <span className="text-indigo-400 font-semibold">F: {m.fatsGrams}g</span>
                            {m.fiberGrams ? (
                              <span className="text-cyan-400 font-medium">Fiber: {m.fiberGrams}g</span>
                            ) : null}
                          </>
                        )}
                      </div>

                      {m.notes && (
                        <p className="text-[11px] text-zinc-500 italic">{m.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">
                        {m.formattedDate || new Date(m.timestamp).toLocaleDateString()}
                      </span>
                      {currentRole !== 'guest' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(m.id || m._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-zinc-500 hover:text-rose-400 transition"
                          title="Delete meal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-xs text-zinc-500">
            <span>Aggregated with high-speed indexing</span>
            <span>Total records: {meals.length}</span>
          </div>
        </div>
      </div>

      {/* Global Food Database Lookup (RBAC Demonstration) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Global Food Nutritional Database</h3>
              {foodAccessTier === 'guest' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Lock className="w-3 h-3" /> GUEST TIER: BASIC CALORIES ONLY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Unlock className="w-3 h-3" /> FULL MACROS UNLOCKED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{foodNotice}</p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search food item..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchFoodDatabase(e.target.value, categoryFilter);
                }}
                className="pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                fetchFoodDatabase(searchQuery, e.target.value);
              }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="protein">Protein</option>
              <option value="carbs">Carbs</option>
              <option value="fats">Fats</option>
              <option value="dairy">Dairy</option>
              <option value="fruit">Fruit</option>
            </select>

            <button
              onClick={handleImportOpenFoodFacts}
              disabled={importingFood}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Import items from Open Food Facts API directly into Supabase"
            >
              <Download className="w-3.5 h-3.5" />
              {importingFood ? 'Importing...' : 'Import from Open Food Facts'}
            </button>
          </div>
        </div>

        {/* Food Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Food Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Serving</th>
                <th className="py-2.5 px-3">Calories</th>
                <th className="py-2.5 px-3">Protein</th>
                <th className="py-2.5 px-3">Carbs</th>
                <th className="py-2.5 px-3">Fats</th>
                <th className="py-2.5 px-3">Fiber</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {foodItems.map((item) => (
                <tr key={item.id || item._id} className="hover:bg-zinc-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {item.name}
                    {item.publicNotes && (
                      <span className="block text-[10px] font-normal text-zinc-500">{item.publicNotes}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">{item.servingSize}</td>
                  <td className="py-2.5 px-3 font-bold text-orange-400">{item.calories} kcal</td>

                  {/* Field Projection Guard: Locked for Guest */}
                  {foodAccessTier === 'guest' ? (
                    <>
                      <td colSpan={4} className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span className="text-zinc-400">Locked for Guest: Sign up to view P / C / F / Fiber</span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">{item.proteinGrams}g</td>
                      <td className="py-2.5 px-3 font-semibold text-amber-400">{item.carbsGrams}g</td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-400">{item.fatsGrams}g</td>
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">{item.fiberGrams}g</td>
                    </>
                  )}

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleQuickAddFood(item)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 font-semibold text-[11px] transition"
                    >
                      Use
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL 1: Single Meal Nutritional Telemetry */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Meal Telemetry Log
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {activeModalItem.mealType}
              </span>
            </div>

            <h2 className="text-xl font-black text-white">{activeModalItem.mealName}</h2>
            <p className="text-xs text-zinc-400">
              Logged on {activeModalItem.formattedDate || new Date(activeModalItem.timestamp).toLocaleDateString()} at {activeModalItem.formattedTime || new Date(activeModalItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* High-impact Macro Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Energy</span>
                <span className="text-lg font-black text-orange-400">
                  {activeModalItem.calories} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                </span>
              </div>
              {currentRole === 'guest' ? (
                <div className="col-span-1 sm:col-span-3 p-3 rounded-xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center text-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Macronutrients Locked (Guest Role)
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      Sign in to view protein, carbs, fats, and fiber breakdown.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Protein</span>
                    <span className="text-lg font-black text-emerald-400">
                      {activeModalItem.proteinGrams}g
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Carbs</span>
                    <span className="text-lg font-black text-amber-400">
                      {activeModalItem.carbsGrams}g
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold block">Fats</span>
                    <span className="text-lg font-black text-indigo-400">
                      {activeModalItem.fatsGrams}g
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Macro Contribution Bar */}
            {currentRole !== 'guest' && activeModalItem.macroRatio && (
              <div className="mb-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <span className="text-[11px] font-bold text-zinc-300 block mb-2">
                  Caloric Energy Distribution
                </span>
                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${activeModalItem.macroRatio.protein}%` }}
                    title={`Protein: ${activeModalItem.macroRatio.protein}%`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${activeModalItem.macroRatio.carbs}%` }}
                    title={`Carbs: ${activeModalItem.macroRatio.carbs}%`}
                  />
                  <div
                    className="bg-indigo-500 h-full"
                    style={{ width: `${activeModalItem.macroRatio.fats}%` }}
                    title={`Fats: ${activeModalItem.macroRatio.fats}%`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Protein {activeModalItem.macroRatio.protein}% ({Math.round(activeModalItem.proteinGrams * 4)} kcal)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Carbs {activeModalItem.macroRatio.carbs}% ({Math.round(activeModalItem.carbsGrams * 4)} kcal)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Fats {activeModalItem.macroRatio.fats}% ({Math.round(activeModalItem.fatsGrams * 9)} kcal)
                  </span>
                </div>
              </div>
            )}

            {/* Detailed Nutrient Breakdown List */}
            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              {currentRole !== 'guest' && (
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Dietary Fiber</span>
                  <span className="font-semibold text-cyan-400">{activeModalItem.fiberGrams || 0} g</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">Meal Category</span>
                <span className="font-semibold uppercase tracking-wider text-zinc-300">{activeModalItem.mealType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">Log Timestamp</span>
                <span className="font-semibold">{new Date(activeModalItem.timestamp).toLocaleString()}</span>
              </div>
              {activeModalItem.notes && (
                <div className="pt-2">
                  <span className="text-zinc-500 block mb-1">Athlete Notes / Ingredients:</span>
                  <p className="italic text-zinc-400 font-mono text-[11px] bg-zinc-900 p-2 rounded">
                    "{activeModalItem.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  handleQuickAddFood({
                    _id: activeModalItem.id,
                    id: activeModalItem.id,
                    name: activeModalItem.mealName,
                    category: activeModalItem.mealType,
                    servingSize: '1 portion',
                    calories: activeModalItem.calories,
                    proteinGrams: activeModalItem.proteinGrams,
                    carbsGrams: activeModalItem.carbsGrams,
                    fatsGrams: activeModalItem.fatsGrams,
                    fiberGrams: activeModalItem.fiberGrams,
                  });
                  setActiveModalItem(null);
                }}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition"
              >
                Copy to Logger
              </button>
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
              >
                Close Pop-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL 2: Full Meal Plan History Modal */}
      {showAllHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[88vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  Historical Meal Plan Logs &amp; Macronutrient Records
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete chronological nutritional database for current user
                </p>
              </div>
              <button
                onClick={() => setShowAllHistoryModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800/80">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter past meals..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setHistoryTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition shrink-0 ${
                      historyTypeFilter === type
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Historical Table */}
            <div className="overflow-y-auto my-3 space-y-2 pr-1 flex-1">
              {(() => {
                const filtered = meals.filter((m) => {
                  const matchQuery =
                    !historySearchQuery ||
                    m.mealName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                    (m.notes && m.notes.toLowerCase().includes(historySearchQuery.toLowerCase()));
                  const matchType =
                    historyTypeFilter === 'all' || m.mealType.toLowerCase() === historyTypeFilter.toLowerCase();
                  return matchQuery && matchType;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-xs text-zinc-500">
                      No historical meal records match the specified filters.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Date &amp; Time</th>
                        <th className="py-2.5 px-3">Meal / Food Item</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Calories</th>
                        <th className="py-2.5 px-3">Protein</th>
                        <th className="py-2.5 px-3">Carbs</th>
                        <th className="py-2.5 px-3">Fats</th>
                        <th className="py-2.5 px-3">Fiber</th>
                        <th className="py-2.5 px-3">Macro Ratio</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filtered.map((m) => (
                        <tr
                          key={m.id || m._id}
                          onClick={() => setActiveModalItem(m)}
                          className="hover:bg-zinc-800/40 cursor-pointer transition group"
                        >
                          <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                            <span className="text-zinc-300 font-medium block">
                              {m.formattedDate || new Date(m.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {m.formattedTime || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white group-hover:text-emerald-400 transition">
                            {m.mealName}
                            {m.notes && (
                              <span className="block text-[10px] text-zinc-500 font-normal italic truncate max-w-xs">
                                "{m.notes}"
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {m.mealType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-orange-400 whitespace-nowrap">
                            {m.calories} kcal
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-400">{m.proteinGrams}g</td>
                          <td className="py-2.5 px-3 font-semibold text-amber-400">{m.carbsGrams}g</td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-400">{m.fatsGrams}g</td>
                          <td className="py-2.5 px-3 font-semibold text-cyan-400">{m.fiberGrams || 0}g</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {m.macroRatio ? (
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                {m.macroRatio.protein}P • {m.macroRatio.carbs}C • {m.macroRatio.fats}F
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeal(m.id || m._id);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                              title="Delete meal"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-3 text-xs">
                <span>
                  <strong>{meals.length}</strong> total meal logs recorded
                </span>
                {historySummary && (
                  <span className="text-zinc-500 hidden sm:inline">
                    • Cumulative: <strong className="text-orange-400">{historySummary.totalCaloriesLogged} kcal</strong> / <strong className="text-emerald-400">{historySummary.totalProteinGrams}g protein</strong>
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAllHistoryModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
