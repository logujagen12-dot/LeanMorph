import { Pencil, Trash2 } from 'lucide-react';
import type { FoodEntry } from '@/lib/types';

interface FoodCardProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export function FoodCard({ entry, onEdit, onDelete }: FoodCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 p-3 group transition-all hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/30 dark:hover:bg-brand-500/5">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{entry.food_name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {entry.quantity}{entry.unit} · {Math.round(entry.calories)} kcal
        </p>
        <div className="flex gap-2.5 mt-1.5 text-xs">
          <span className="text-zinc-700 dark:text-zinc-300">P {Math.round(entry.protein)}g</span>
          <span className="text-zinc-700 dark:text-zinc-300">C {Math.round(entry.carbs)}g</span>
          <span className="text-zinc-700 dark:text-zinc-300">F {Math.round(entry.fat)}g</span>
          <span className="text-zinc-500 dark:text-zinc-400">Fb {Math.round(entry.fiber)}g</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          aria-label="Edit food"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Delete food"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
