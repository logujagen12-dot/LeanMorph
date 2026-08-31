interface ProgressBarProps {
  current: number;
  target: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  unit?: string;
}

export function ProgressBar({
  current,
  target,
  color = '#18181b',
  height = 'h-2',
  showLabel = false,
  unit = '',
}: ProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className={`w-full ${height} rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 shimmer-bg opacity-25" />
        </div>
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {current.toLocaleString()}{unit}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {target.toLocaleString()}{unit}
          </span>
        </div>
      )}
    </div>
  );
}
