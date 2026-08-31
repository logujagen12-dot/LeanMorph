import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FoodEntry, MealType } from '@/lib/types';
import { FoodCard } from './FoodCard';
import { sumNutrition } from '@/lib/nutrition';

interface MealSectionProps {
  title: string;
  meal: MealType;
  entries: FoodEntry[];
  onAdd: (meal: MealType) => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
  icon: React.ReactNode;
}

export function MealSection({ title, meal, entries, onAdd, onEdit, onDelete, icon }: MealSectionProps) {
  const totals = sumNutrition(entries);

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-display font-semibold text-zinc-900 dark:text-white">{title}</h3>
        </div>
        {entries.length > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{Math.round(totals.calories)} kcal</p>
            <p className="text-xs text-zinc-400 tabular-nums">
              P {Math.round(totals.protein)} · C {Math.round(totals.carbs)} · F {Math.round(totals.fat)}
            </p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FoodCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2">No items logged yet.</p>
      )}
      <button
        onClick={() => onAdd(meal)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        Add Food
      </button>
    </div>
  );
}
