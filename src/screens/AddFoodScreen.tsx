import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Heart, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { computeNutrition } from '@/lib/nutrition';
import { FOOD_CATEGORIES } from '@/lib/seed-data';
import type { Food, FoodEntry, MealType, Unit, FavoriteFood } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

interface AddFoodScreenProps {
  selectedDate: string;
  preselectedMeal: MealType;
  onAdded: () => void;
}

const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'piece', 'cup', 'tbsp', 'tsp'];
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function AddFoodScreen({ selectedDate, preselectedMeal, onAdded }: AddFoodScreenProps) {
  const { showToast } = useToast();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [foods, setFoods] = useState<Food[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<Unit>('g');
  const [meal, setMeal] = useState<MealType>(preselectedMeal);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [customFood, setCustomFood] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, serving: 100,
  });

  const loadFoods = useCallback(async (searchQuery: string, cat: string) => {
    setLoading(true);
    let q = supabase.from('foods').select('*');
    if (searchQuery) {
      q = q.ilike('name', `%${searchQuery}%`);
    }
    if (cat !== 'All') {
      q = q.eq('category', cat);
    }
    q = q.limit(50);
    const { data } = await q.order('name', { ascending: true });
    setFoods((data as Food[]) || []);
    setLoading(false);
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('favorite_foods')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setFavorites((data as FavoriteFood[]) || []);
  }, [session?.user]);

  const loadRecentSearches = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('food_search_history')
      .select('query')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentSearches((data?.map((d: { query: string }) => d.query) as string[]) || []);
  }, [session?.user]);

  useEffect(() => {
    loadFoods('', 'All');
    loadFavorites();
    loadRecentSearches();
  }, [loadFoods, loadFavorites, loadRecentSearches]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadFoods(query, category), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, category, loadFoods]);

  const saveSearchHistory = async (searchQuery: string) => {
    if (!session?.user || !searchQuery) return;
    await supabase.from('food_search_history').insert({ query: searchQuery, user_id: session.user.id });
  };

  const openAddModal = (food: Food) => {
    setSelectedFood(food);
    setQuantity(food.serving_size || 100);
    setUnit(food.serving_unit as Unit || 'g');
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!selectedFood || !session?.user) return;
    const nutrition = computeNutrition(
      {
        calories: selectedFood.calories_per_100g,
        protein: selectedFood.protein_per_100g,
        carbs: selectedFood.carbs_per_100g,
        fat: selectedFood.fat_per_100g,
        fiber: selectedFood.fiber_per_100g,
      },
      quantity,
      unit
    );

    const { error } = await supabase.from('food_entries').insert({
      user_id: session.user.id,
      date: selectedDate,
      meal,
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      quantity,
      unit,
      ...nutrition,
    });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(`Added ${selectedFood.name} to ${MEAL_LABELS[meal]}`, 'success');
      setShowAddModal(false);
      saveSearchHistory(query);
      onAdded();
    }
  };

  const toggleFavorite = async (food: Food) => {
    if (!session?.user) return;
    const existing = favorites.find((f) => f.food_id === food.id);
    if (existing) {
      await supabase.from('favorite_foods').delete().eq('id', existing.id);
      setFavorites((prev) => prev.filter((f) => f.food_id !== food.id));
    } else {
      const { data } = await supabase
        .from('favorite_foods')
        .insert({ food_id: food.id, food_name: food.name, user_id: session.user.id })
        .select()
        .single();
      if (data) setFavorites((prev) => [data as FavoriteFood, ...prev]);
    }
  };

  const handleCreateCustom = async () => {
    if (!session?.user || !customFood.name) return;
    const { data, error } = await supabase
      .from('foods')
      .insert({
        name: customFood.name,
        category: 'Custom',
        serving_size: customFood.serving,
        serving_unit: 'g',
        calories_per_100g: (customFood.calories / customFood.serving) * 100,
        protein_per_100g: (customFood.protein / customFood.serving) * 100,
        carbs_per_100g: (customFood.carbs / customFood.serving) * 100,
        fat_per_100g: (customFood.fat / customFood.serving) * 100,
        fiber_per_100g: (customFood.fiber / customFood.serving) * 100,
        is_custom: true,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Custom food created!', 'success');
      setShowCustomModal(false);
      setCustomFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, serving: 100 });
      loadFoods(query, category);
    }
  };

  const computedNutrition = selectedFood
    ? computeNutrition(
        {
          calories: selectedFood.calories_per_100g,
          protein: selectedFood.protein_per_100g,
          carbs: selectedFood.carbs_per_100g,
          fat: selectedFood.fat_per_100g,
          fiber: selectedFood.fiber_per_100g,
        },
        quantity,
        unit
      )
    : null;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Add Food</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Search or create custom food entries</p>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-float transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Custom Food
        </button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food..."
          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-11 pr-10 py-3.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-soft"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip ${category === cat ? 'chip-active' : 'chip-inactive'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {favorites.length > 0 && !query && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-brand-500" /> Favorites
          </h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => {
                  const food = foods.find((f) => f.id === fav.food_id);
                  if (food) openAddModal(food);
                }}
                className="whitespace-nowrap rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all active:scale-95"
              >
                {fav.food_name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {recentSearches.length > 0 && !query && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-400" /> Recent Searches
          </h3>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => setQuery(s)}
                className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : foods.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No foods found"
          description="Try a different search or create a custom food entry."
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {foods.map((food) => (
            <StaggerItem key={food.id}>
              <div className="group flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card transition-all">
                <button onClick={() => openAddModal(food)} className="flex-1 text-left">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white">{food.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {food.calories_per_100g} kcal · P: {food.protein_per_100g}g · C: {food.carbs_per_100g}g · F: {food.fat_per_100g}g
                  </p>
                  <span className="inline-block mt-1.5 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{food.category}</span>
                </button>
                <button
                  onClick={() => toggleFavorite(food)}
                  className="p-2.5 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-90"
                  aria-label="Toggle favorite"
                >
                  <Heart className={`w-5 h-5 transition-all ${favorites.some((f) => f.food_id === food.id) ? 'fill-brand-500 text-brand-500 scale-110' : 'group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                </button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add to Meal" size="sm">
        {selectedFood && computedNutrition && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">{selectedFood.name}</p>
              <p className="text-xs text-zinc-400">{selectedFood.category}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                  className="input-field"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Meal</label>
              <div className="grid grid-cols-2 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMeal(m)}
                    className={`py-2 rounded-xl text-sm font-medium capitalize transition-all active:scale-95 ${
                      meal === m ? 'bg-brand-500 text-white shadow-soft' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {MEAL_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-3.5 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Calories</span><span className="font-medium text-zinc-900 dark:text-white">{computedNutrition.calories} kcal</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Protein</span><span className="font-medium text-zinc-900 dark:text-white">{computedNutrition.protein}g</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Carbs</span><span className="font-medium text-zinc-900 dark:text-white">{computedNutrition.carbs}g</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Fat</span><span className="font-medium text-zinc-900 dark:text-white">{computedNutrition.fat}g</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Fiber</span><span className="font-medium text-zinc-900 dark:text-white">{computedNutrition.fiber}g</span></div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:shadow-float transition-all active:scale-[0.98]"
            >
              Add to {MEAL_LABELS[meal]}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={showCustomModal} onClose={() => setShowCustomModal(false)} title="Create Custom Food" size="md">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Food Name</label>
            <input
              type="text"
              value={customFood.name}
              onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
              placeholder="e.g. Homemade Dal"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Serving Size (g)</label>
            <input
              type="number"
              value={customFood.serving}
              onChange={(e) => setCustomFood({ ...customFood, serving: parseFloat(e.target.value) || 100 })}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['calories', 'protein', 'carbs', 'fat', 'fiber'] as const).map((field) => (
              <div key={field}>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block capitalize">{field} (per serving)</label>
                <input
                  type="number"
                  value={customFood[field]}
                  onChange={(e) => setCustomFood({ ...customFood, [field]: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleCreateCustom}
            className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:shadow-float transition-all active:scale-[0.98]"
          >
            Save Custom Food
          </button>
        </div>
      </Modal>
    </div>
  );
}
