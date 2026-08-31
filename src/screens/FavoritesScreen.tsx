import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { computeNutrition } from '@/lib/nutrition';
import type { FavoriteFood, Food, MealType, Unit } from '@/lib/types';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'piece', 'cup', 'tbsp', 'tsp'];

export function FavoritesScreen({ selectedDate }: { selectedDate: string }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<Unit>('g');
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data: favs } = await supabase.from('favorite_foods').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const favList = (favs as FavoriteFood[]) || [];
    setFavorites(favList);
    if (favList.length > 0) {
      const { data: foodsData } = await supabase.from('foods').select('*').in('id', favList.map((f) => f.food_id).filter(Boolean));
      setFoods((foodsData as Food[]) || []);
    }
    setLoading(false);
  }, [session?.user]);

  useEffect(() => { load(); }, [load]);

  const removeFavorite = async (id: string) => {
    await supabase.from('favorite_foods').delete().eq('id', id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    showToast('Removed from favorites', 'success');
  };

  const openAdd = (food: Food) => {
    setSelectedFood(food);
    setQuantity(food.serving_size || 100);
    setUnit(food.serving_unit as Unit || 'g');
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!selectedFood || !session?.user) return;
    const n = computeNutrition(
      { calories: selectedFood.calories_per_100g, protein: selectedFood.protein_per_100g, carbs: selectedFood.carbs_per_100g, fat: selectedFood.fat_per_100g, fiber: selectedFood.fiber_per_100g },
      quantity, unit
    );
    const { error } = await supabase.from('food_entries').insert({
      user_id: session.user.id, date: selectedDate, meal, food_id: selectedFood.id, food_name: selectedFood.name, quantity, unit, ...n,
    });
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Added ${selectedFood.name} to ${MEAL_LABELS[meal]}`, 'success');
    setShowModal(false);
  };

  if (loading) return <div className="p-4 md:p-8"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Favorites</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Quick access to your favorite foods</p>
      </motion.div>

      {favorites.length === 0 ? (
        <EmptyState icon={<Heart className="w-8 h-8" />} title="No favorites yet" description="Tap the heart icon on foods to save them here for quick access." />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {favorites.map((fav) => {
            const food = foods.find((f) => f.id === fav.food_id);
            return (
              <StaggerItem key={fav.id}>
                <div className="group flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card transition-all">
                  <button onClick={() => food && openAdd(food)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-brand-500 fill-brand-500" />
                      <p className="font-medium text-sm text-zinc-900 dark:text-white">{fav.food_name}</p>
                    </div>
                    {food && <p className="text-xs text-zinc-400 mt-1">{food.calories_per_100g} kcal/100g · P:{food.protein_per_100g}g C:{food.carbs_per_100g}g F:{food.fat_per_100g}g</p>}
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => food && openAdd(food)} className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-all active:scale-90"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => removeFavorite(fav.id)} className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add to Meal" size="sm">
        {selectedFood && (
          <div className="space-y-4">
            <p className="font-semibold text-zinc-900 dark:text-white">{selectedFood.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm text-zinc-500 mb-1 block">Quantity</label><input type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} className="input-field" /></div>
              <div><label className="text-sm text-zinc-500 mb-1 block">Unit</label><select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="input-field">{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div><label className="text-sm text-zinc-500 mb-1 block">Meal</label><div className="grid grid-cols-2 gap-2">{(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => <button key={m} onClick={() => setMeal(m)} className={`py-2 rounded-xl text-sm font-medium capitalize transition-all active:scale-95 ${meal === m ? 'bg-brand-500 text-white shadow-soft' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{MEAL_LABELS[m]}</button>)}</div></div>
            <button onClick={handleAdd} className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:shadow-float transition-all active:scale-[0.98]">Add to {MEAL_LABELS[meal]}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
