import { motion } from 'framer-motion';

interface MacroCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon?: React.ReactNode;
}

export function MacroCard({ label, current, target, unit, color, icon }: MacroCardProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);
  const isComplete = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card-surface-hover p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span style={{ color }}>{icon}</span>}
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
        {isComplete && (
          <span className="ml-auto text-[10px] font-semibold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full">
            Done
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{Math.round(current)}</span>
        <span className="text-sm text-zinc-400">/ {Math.round(target)}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 shimmer-bg opacity-30" />
        </motion.div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-zinc-400 tabular-nums">{percentage.toFixed(0)}%</span>
        <span className="text-xs text-zinc-400">
          {remaining > 0 ? `${Math.round(remaining)}${unit} left` : 'Complete'}
        </span>
      </div>
    </motion.div>
  );
}
