import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { sumNutrition, computeNutrition } from '@/lib/nutrition';
import type { SavedMeal, SavedMealItem, Food, MealType } from '@/lib/types';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { format } from 'date-fns';

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function SavedMealsScreen({ selectedDate }: { selectedDate: string }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [items, setItems] = useState<Record<string, SavedMealItem[]>>({});
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState<SavedMealItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [addingMeal, setAddingMeal] = useState<string | null>(null);

  const loadMeals = useCallback(async () => {
    if (!session?.user) return;
    const { data: mealsData } = await supabase.from('saved_meals').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const mealList = (mealsData as SavedMeal[]) || [];
    setMeals(mealList);
    if (mealList.length > 0) {
      const { data: itemsData } = await supabase.from('saved_meal_items').select('*').in('saved_meal_id', mealList.map((m) => m.id));
      const itemMap: Record<string, SavedMealItem[]> = {};
      (itemsData as SavedMealItem[])?.forEach((item) => {
        if (!itemMap[item.saved_meal_id]) itemMap[item.saved_meal_id] = [];
        itemMap[item.saved_meal_id].push(item);
      });
      setItems(itemMap);
    }
    const { data: foodsData } = await supabase.from('foods').select('*').limit(50);
    setFoods((foodsData as Food[]) || []);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => { loadMeals(); }, [loadMeals]);

  const addIngredient = () => {
    if (!selectedFood) return;
    const nutrition = computeNutrition(
      { calories: selectedFood.calories_per_100g, protein: selectedFood.protein_per_100g, carbs: selectedFood.carbs_per_100g, fat: selectedFood.fat_per_100g, fiber: selectedFood.fiber_per_100g },
      quantity, unit
    );
    setIngredients([...ingredients, {
      id: crypto.randomUUID(), saved_meal_id: '', food_id: selectedFood.id, food_name: selectedFood.name,
      quantity, unit, ...nutrition, created_at: new Date().toISOString(),
    }]);
    setSelectedFood(null); setQuantity(100); setUnit('g');
  };

  const saveMeal = async () => {
    if (!session?.user || !mealName || ingredients.length === 0) return;
    const totals = sumNutrition(ingredients);
    const { data: mealData, error } = await supabase.from('saved_meals').insert({
      user_id: session.user.id, name: mealName,
      total_calories: totals.calories, total_protein: totals.protein, total_carbs: totals.carbs, total_fat: totals.fat, total_fiber: totals.fiber,
    }).select().single();
    if (error) { showToast(error.message, 'error'); return; }
    const mealId = (mealData as SavedMeal).id;
    for (const ing of ingredients) {
      await supabase.from('saved_meal_items').insert({
        saved_meal_id: mealId, food_id: ing.food_id, food_name: ing.food_name,
        quantity: ing.quantity, unit: ing.unit, calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat, fiber: ing.fiber,
      });
    }
    showToast('Meal saved!', 'success');
    setShowBuilder(false); setMealName(''); setIngredients([]);
    loadMeals();
  };

  const deleteMeal = async (id: string) => {
    await supabase.from('saved_meals').delete().eq('id', id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Meal deleted', 'success');
  };

  const addMealToLog = async (meal: SavedMeal, mealItems: SavedMealItem[], targetMeal: MealType) => {
    if (!session?.user) return;
    for (const item of mealItems) {
      await supabase.from('food_entries').insert({
        user_id: session.user.id, date: selectedDate, meal: targetMeal,
        food_id: item.food_id, food_name: item.food_name, quantity: item.quantity, unit: item.unit,
        calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber,
      });
    }
    showToast(`Added ${meal.name} to ${MEAL_LABELS[targetMeal]}`, 'success');
    setAddingMeal(null);
  };

  if (loading) return <div className="p-4 md:p-8"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Saved Meals</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Reusable meal templates for quick logging</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-float transition-all active:scale-95">
          <Plus className="w-4 h-4" /> New Meal
        </button>
      </motion.div>

      {meals.length === 0 ? (
        <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No saved meals yet" description="Create reusable meal templates for quick logging." action={<button onClick={() => setShowBuilder(true)} className="rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all active:scale-95">Create Meal</button>} />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meals.map((meal) => {
            const mealItems = items[meal.id] || [];
            return (
              <StaggerItem key={meal.id}>
                <div className="card-surface-hover p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-zinc-900 dark:text-white">{meal.name}</h3>
                    <button onClick={() => deleteMeal(meal.id)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full">{Math.round(meal.total_calories)} kcal</span>
                    <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full">P: {Math.round(meal.total_protein)}g</span>
                    <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full">C: {Math.round(meal.total_carbs)}g</span>
                    <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full">F: {Math.round(meal.total_fat)}g</span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {mealItems.map((item) => (
                      <div key={item.id} className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-between">
                        <span>{item.food_name}</span><span className="text-zinc-400">{item.quantity}{item.unit}</span>
                      </div>
                    ))}
                  </div>
                  <AnimatePresence>
                    {addingMeal === meal.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-4 gap-2"
                      >
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                          <button key={m} onClick={() => addMealToLog(meal, mealItems, m)} className="py-2 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors active:scale-95">{MEAL_LABELS[m]}</button>
                        ))}
                        <button onClick={() => setAddingMeal(null)} className="col-span-4 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Cancel</button>
                      </motion.div>
                    ) : (
                      <button onClick={() => setAddingMeal(meal.id)} className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-2.5 text-sm text-zinc-500 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all active:scale-[0.99]">
                        <UtensilsCrossed className="w-4 h-4" /> Add to Today
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      <Modal open={showBuilder} onClose={() => setShowBuilder(false)} title="Create Saved Meal" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Meal Name</label>
            <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. My Morning Oats" className="input-field" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ingredients</h4>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm">
                <span className="text-zinc-900 dark:text-white">{ing.food_name} ({ing.quantity}{ing.unit})</span>
                <button onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-90"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Add Ingredient</label>
            <select value={selectedFood?.id || ''} onChange={(e) => setSelectedFood(foods.find((f) => f.id === e.target.value) || null)} className="input-field mb-2">
              <option value="">Select food...</option>
              {foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} placeholder="Qty" className="input-field flex-1" />
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="input-field w-20" />
              <button onClick={addIngredient} disabled={!selectedFood} className="rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-95">Add</button>
            </div>
          </div>
          {ingredients.length > 0 && (
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3.5">
              {(() => { const t = sumNutrition(ingredients); return (
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div><p className="text-xs text-zinc-400">Cal</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(t.calories)}</p></div>
                  <div><p className="text-xs text-zinc-400">Pro</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(t.protein)}g</p></div>
                  <div><p className="text-xs text-zinc-400">Car</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(t.carbs)}g</p></div>
                  <div><p className="text-xs text-zinc-400">Fat</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(t.fat)}g</p></div>
                  <div><p className="text-xs text-zinc-400">Fib</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(t.fiber)}g</p></div>
                </div>
              ); })()}
            </div>
          )}
          <button onClick={saveMeal} disabled={!mealName || ingredients.length === 0} className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-3 text-sm font-semibold text-white shadow-soft hover:shadow-float transition-all active:scale-[0.98]">Save Meal</button>
        </div>
      </Modal>
    </div>
  );
}
