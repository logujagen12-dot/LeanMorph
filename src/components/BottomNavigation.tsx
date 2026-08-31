import { Home, Plus, Camera, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type PageId = 'home' | 'add' | 'scan' | 'history' | 'profile' | 'ai' | 'progress' | 'settings' | 'saved' | 'favorites';

interface BottomNavigationProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'scan', label: 'Scan', icon: Camera },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNavigation({ active, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isCenter = item.id === 'add' || item.id === 'scan';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 px-2 py-1.5 relative"
              aria-label={item.label}
            >
              {isCenter && isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-1 w-10 h-10 rounded-xl bg-brand-500/10"
                />
              )}
              <Icon
                className={`relative z-10 transition-all ${
                  isActive ? 'text-brand-500' : 'text-zinc-400 dark:text-zinc-500'
                } ${isCenter ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'scale-110' : ''}`}
              />
              <span className={`text-xs relative z-10 transition-colors ${isActive ? 'text-brand-500 font-medium' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
