import { useEffect } from 'react';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ count = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 p-4 overflow-hidden relative">
          <div className="absolute inset-0 shimmer-bg" />
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700/60" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 p-4 overflow-hidden relative">
      <div className="absolute inset-0 shimmer-bg" />
      <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700/60 mb-3 relative" />
      <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-700/60 mb-2 relative" />
      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700/60 relative" />
    </div>
  );
}

export function RingSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 overflow-hidden relative"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 shimmer-bg" />
    </div>
  );
}

export function PageSkeleton() {
  useEffect(() => {
    return;
  }, []);
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
        <div className="absolute inset-0 shimmer-bg" />
      </div>
      <div className="flex justify-center">
        <RingSkeleton />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <LoadingSkeleton count={4} />
    </div>
  );
}
