import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image as ImageIcon, Loader2, Sparkles, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { sumNutrition } from '@/lib/nutrition';
import type { AIDetectedFood, MealType } from '@/lib/types';

interface ScanScreenProps {
  selectedDate: string;
  onAdded: () => void;
}

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function ScanScreen({ selectedDate, onAdded }: ScanScreenProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<AIDetectedFood[]>([]);
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imageData) return;
    setAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-food-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ image: imageData, mode: 'image' }),
        }
      );
      if (!response.ok) throw new Error('Analysis failed');
      const result = await response.json();
      if (result.foods && result.foods.length > 0) {
        setDetectedFoods(result.foods);
        setShowResults(true);
      } else {
        showToast('Could not detect food. Try a clearer photo.', 'error');
      }
    } catch {
      showToast('AI analysis failed. Please try again.', 'error');
    }
    setAnalyzing(false);
  };

  const updateFood = (index: number, field: keyof AIDetectedFood, value: string | number) => {
    setDetectedFoods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: typeof value === 'string' && field !== 'name' && field !== 'unit' ? parseFloat(value) || 0 : value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!session?.user) return;
    for (const food of detectedFoods) {
      const { error } = await supabase.from('food_entries').insert({
        user_id: session.user.id,
        date: selectedDate,
        meal,
        food_name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
      });
      if (error) {
        showToast(error.message, 'error');
        return;
      }
    }
    showToast(`Added ${detectedFoods.length} item(s) to ${MEAL_LABELS[meal]}`, 'success');
    reset();
    onAdded();
  };

  const reset = () => {
    setImagePreview(null);
    setImageData(null);
    setDetectedFoods([]);
    setShowResults(false);
  };

  const totals = sumNutrition(detectedFoods);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-24 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">Scan Food</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Take a photo or upload an image. AI will estimate the nutrition.</p>

      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!imagePreview ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center cursor-pointer hover:border-brand-500 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-brand-500" />
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">Tap to upload a food photo</p>
                  <p className="text-xs text-zinc-400 mt-1">JPG, PNG up to 5MB</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ImageIcon className="w-4 h-4" /> Gallery
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <img src={imagePreview} alt="Food preview" className="w-full rounded-2xl max-h-80 object-cover" />
                <div className="flex gap-3">
                  <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-3 text-sm font-semibold text-white"
                  >
                    {analyzing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Analyze with AI</>
                    )}
                  </button>
                </div>
                {analyzing && (
                  <div className="rounded-2xl bg-brand-50 dark:bg-brand-500/10 p-4 text-center">
                    <p className="text-sm text-brand-600 dark:text-brand-400">AI is analyzing your food image...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs">AI estimates are approximate. Please verify before saving.</p>
            </div>

            <div className="space-y-3">
              {detectedFoods.map((food, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => updateFood(i, 'name', e.target.value)}
                      className="font-medium text-zinc-900 dark:text-white bg-transparent border-none focus:outline-none flex-1"
                    />
                    <button onClick={() => setEditingIndex(editingIndex === i ? null : i)} className="p-2 text-zinc-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="text-xs text-zinc-400">Quantity</label>
                      <input type="number" value={food.quantity} onChange={(e) => updateFood(i, 'quantity', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Unit</label>
                      <input type="text" value={food.unit} onChange={(e) => updateFood(i, 'unit', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Calories</label>
                      <input type="number" value={food.calories} onChange={(e) => updateFood(i, 'calories', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Protein (g)</label>
                      <input type="number" value={food.protein} onChange={(e) => updateFood(i, 'protein', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Carbs (g)</label>
                      <input type="number" value={food.carbs} onChange={(e) => updateFood(i, 'carbs', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Fat (g)</label>
                      <input type="number" value={food.fat} onChange={(e) => updateFood(i, 'fat', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Fiber (g)</label>
                      <input type="number" value={food.fiber} onChange={(e) => updateFood(i, 'fiber', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-zinc-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Total Nutrition</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div><p className="text-xs text-zinc-400">Cal</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(totals.calories)}</p></div>
                <div><p className="text-xs text-zinc-400">Pro</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(totals.protein)}g</p></div>
                <div><p className="text-xs text-zinc-400">Car</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(totals.carbs)}g</p></div>
                <div><p className="text-xs text-zinc-400">Fat</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(totals.fat)}g</p></div>
                <div><p className="text-xs text-zinc-400">Fib</p><p className="font-bold text-zinc-900 dark:text-white">{Math.round(totals.fiber)}g</p></div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Add to Meal</label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                  <button key={m} onClick={() => setMeal(m)} className={`py-2 rounded-xl text-sm font-medium capitalize transition-colors ${meal === m ? 'bg-brand-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    {MEAL_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Cancel</button>
              <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white">
                <Check className="w-4 h-4" /> Confirm & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
