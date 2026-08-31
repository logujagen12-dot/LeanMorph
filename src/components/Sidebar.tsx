import { Home, Plus, Camera, History, User, Bot, TrendingUp, Settings, Bookmark, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PageId } from './BottomNavigation';
import { BrandLogo } from './BrandLogo';
import type { UserProfile } from '@/lib/types';

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
  profile: UserProfile;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'add', label: 'Add Food', icon: Plus },
  { id: 'scan', label: 'Scan Food', icon: Camera },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'history', label: 'History', icon: History },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'saved', label: 'Saved Meals', icon: Bookmark },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ active, onNavigate, profile }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 z-20">
      <div className="flex items-center gap-2.5 px-2 py-4 mb-4">
        <BrandLogo size="md" />
        <div>
          <h1 className="font-display font-bold text-zinc-900 dark:text-white text-[15px]">LeanMorph</h1>
          <p className="text-xs text-zinc-400">Transform Your Body</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-soft'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 px-3 py-3 mt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Your profile" className="w-9 h-9 rounded-xl object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold">
            {(profile.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{profile.name || 'Your profile'}</p>
          <p className="text-[11px] text-zinc-400">Personal account</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative px-3 py-3.5 mt-2 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/5 border border-brand-200/50 dark:border-brand-800/30 overflow-hidden"
      >
        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-brand-500/10 blur-xl" />
        <p className="relative text-xs font-medium text-brand-700 dark:text-brand-400">Stay consistent!</p>
        <p className="relative text-[11px] text-brand-600/70 dark:text-brand-400/60 mt-0.5">Track daily for best results</p>
      </motion.div>
    </aside>
  );
}
