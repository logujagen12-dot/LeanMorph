import { Droplet, Footprints, Moon, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProgressBar } from './ProgressBar';

interface MetricCardProps {
  icon: 'water' | 'steps' | 'sleep' | 'workout';
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const ICONS = {
  water: Droplet,
  steps: Footprints,
  sleep: Moon,
  workout: Dumbbell,
};

export function MetricCard({ icon, label, current, target, unit, color }: MetricCardProps) {
  const Icon = ICONS[icon];
  const hasTarget = target > 0;
  const percentage = hasTarget ? Math.min((current / target) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card-surface-hover p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="font-display text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
            {current.toLocaleString()}{unit}
            {hasTarget && <span className="text-xs font-normal text-zinc-400"> / {target.toLocaleString()}{unit}</span>}
          </p>
        </div>
      </div>
      {hasTarget && (
        <>
          <ProgressBar current={current} target={target} color={color} />
          <p className="text-xs text-zinc-400 mt-2 tabular-nums">{percentage.toFixed(0)}% of daily goal</p>
        </>
      )}
      {!hasTarget && (
        <p className="text-xs text-zinc-400 mt-1">{current > 0 ? 'Logged today' : 'Not logged yet'}</p>
      )}
    </motion.div>
  );
}
