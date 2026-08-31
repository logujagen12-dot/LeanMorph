import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';
import { AuthScreen } from '@/screens/AuthScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { AddFoodScreen } from '@/screens/AddFoodScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { AIScreen } from '@/screens/AIScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SavedMealsScreen } from '@/screens/SavedMealsScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavigation, type PageId } from '@/components/BottomNavigation';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { FoodEntry, MealType } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [page, setPage] = useState<PageId>('home');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [preselectedMeal, setPreselectedMeal] = useState<MealType>('breakfast');
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  // Sync theme with profile preference
  useEffect(() => {
    if (profile?.dark_mode !== undefined) {
      setTheme(profile.dark_mode ? 'dark' : 'light');
    }
  }, [profile?.dark_mode, setTheme]);

  const handleAddToMeal = (meal: MealType) => {
    setPreselectedMeal(meal);
    setPage('add');
  };

  const handleEditEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const { error } = await supabase.from('food_entries').update({
      food_name: editingEntry.food_name,
      quantity: editingEntry.quantity,
      unit: editingEntry.unit,
      calories: editingEntry.calories,
      protein: editingEntry.protein,
      carbs: editingEntry.carbs,
      fat: editingEntry.fat,
      fiber: editingEntry.fiber,
      meal: editingEntry.meal,
    }).eq('id', editingEntry.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Entry updated', 'success');
    setShowEditModal(false);
    setEditingEntry(null);
    setRefreshKey((k) => k + 1);
  };

  const handleFoodAdded = () => {
    setRefreshKey((k) => k + 1);
    setPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (session && !profile && !loading) {
    // Session exists but no profile row yet — create one and show onboarding
    return <OnboardingScreen />;
  }

  if (session && profile && !profile.onboarding_completed) {
    return <OnboardingScreen />;
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomeScreen key={refreshKey} onNavigate={setPage} selectedDate={selectedDate} onDateChange={setSelectedDate} onEditEntry={handleEditEntry} onAddToMeal={handleAddToMeal} />;
      case 'add':
        return <AddFoodScreen selectedDate={selectedDate} preselectedMeal={preselectedMeal} onAdded={handleFoodAdded} />;
      case 'scan':
        return <ScanScreen selectedDate={selectedDate} onAdded={handleFoodAdded} />;
      case 'ai':
        return <AIScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'saved':
        return <SavedMealsScreen selectedDate={selectedDate} />;
      case 'favorites':
        return <FavoritesScreen selectedDate={selectedDate} />;
      case 'profile':
        return <ProfileScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen key={refreshKey} onNavigate={setPage} selectedDate={selectedDate} onDateChange={setSelectedDate} onEditEntry={handleEditEntry} onAddToMeal={handleAddToMeal} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <Sidebar active={page} onNavigate={setPage} profile={profile} />
      <main className="flex-1 md:h-screen md:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNavigation active={page} onNavigate={setPage} />

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingEntry(null); }} title="Edit Food Entry" size="md">
        {editingEntry && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Food Name</label>
              <input type="text" value={editingEntry.food_name} onChange={(e) => setEditingEntry({ ...editingEntry, food_name: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm text-zinc-500 mb-1 block">Quantity</label><input type="number" value={editingEntry.quantity} onChange={(e) => setEditingEntry({ ...editingEntry, quantity: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white" /></div>
              <div><label className="text-sm text-zinc-500 mb-1 block">Unit</label><input type="text" value={editingEntry.unit} onChange={(e) => setEditingEntry({ ...editingEntry, unit: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white" /></div>
            </div>
            <div><label className="text-sm text-zinc-500 mb-1 block">Meal</label><select value={editingEntry.meal} onChange={(e) => setEditingEntry({ ...editingEntry, meal: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white">{['breakfast', 'lunch', 'dinner', 'snack'].map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              {[['calories', 'Calories'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)'], ['fiber', 'Fiber (g)']].map(([key, label]) => (
                <div key={key}><label className="text-sm text-zinc-500 mb-1 block">{label}</label><input type="number" value={(editingEntry as unknown as Record<string, number>)[key]} onChange={(e) => setEditingEntry({ ...editingEntry, [key]: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white" /></div>
              ))}
            </div>
            <button onClick={handleSaveEdit} className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white">Save Changes</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
