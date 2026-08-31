import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800/50 flex items-center justify-center mb-4 text-zinc-400 shadow-soft">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
