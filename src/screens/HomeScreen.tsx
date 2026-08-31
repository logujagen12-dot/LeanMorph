import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Sun, Moon, UtensilsCrossed, Droplet, Plus, Camera, Bot, TrendingUp, Zap, Award, Flame, Bed, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { sumNutrition } from '@/lib/nutrition';
import type { FoodEntry, MealType, WaterLog, StepLog, SleepLog, Workout } from '@/lib/types';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroCard } from '@/components/MacroCard';
import { MetricCard } from '@/components/MetricCard';
import { MealSection } from '@/components/MealSection';
import { LoadingSkeleton, RingSkeleton, CardSkeleton } from '@/components/LoadingSkeleton';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { Modal } from '@/components/Modal';
import { useToast } from '@/lib/toast';
import type { PageId } from '@/components/BottomNavigation';

interface HomeScreenProps {
  onNavigate: (page: PageId) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onEditEntry: (entry: FoodEntry) => void;
  onAddToMeal: (meal: MealType) => void;
}

export function HomeScreen({ onNavigate, selectedDate, onDateChange, onEditEntry, onAddToMeal }: HomeScreenProps) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [stepLog, setStepLog] = useState<StepLog | null>(null);
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepInput, setSleepInput] = useState({ bedtime: '', waketime: '', hours: '' });
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const date = selectedDate;

    const [entriesRes, waterRes, stepsRes, sleepRes, workoutsRes] = await Promise.all([
      supabase.from('food_entries').select('*').eq('date', date).order('created_at', { ascending: true }),
      supabase.from('water_logs').select('*').eq('date', date),
      supabase.from('step_logs').select('*').eq('date', date).maybeSingle(),
      supabase.from('sleep_logs').select('*').eq('date', date).maybeSingle(),
      supabase.from('workouts').select('*').eq('date', date),
    ]);

    setEntries((entriesRes.data as FoodEntry[]) || []);
    setWaterLogs((waterRes.data as WaterLog[]) || []);
    setStepLog((stepsRes.data as StepLog) || null);
    setSleepLog((sleepRes.data as SleepLog) || null);
    setWorkouts((workoutsRes.data as Workout[]) || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    await supabase.from('food_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addWater = async (amount: number) => {
    const { data } = await supabase
      .from('water_logs')
      .insert({ amount_ml: amount, date: selectedDate })
      .select()
      .single();
    if (data) setWaterLogs((prev) => [...prev, data as WaterLog]);
  };

  const logSleep = async () => {
    const hours = parseFloat(sleepInput.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      showToast('Enter a valid sleep duration (0-24 hours)', 'error');
      return;
    }
    if (sleepLog) {
      const { data, error } = await supabase
        .from('sleep_logs')
        .update({
          sleep_time: sleepInput.bedtime || null,
          wake_time: sleepInput.waketime || null,
          duration_hours: hours,
        })
        .eq('id', sleepLog.id)
        .select()
        .single();
      if (error) { showToast(error.message, 'error'); return; }
      setSleepLog(data as SleepLog);
    } else {
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({
          sleep_time: sleepInput.bedtime || null,
          wake_time: sleepInput.waketime || null,
          duration_hours: hours,
          date: selectedDate,
        })
        .select()
        .single();
      if (error) { showToast(error.message, 'error'); return; }
      setSleepLog(data as SleepLog);
    }
    showToast('Sleep logged!', 'success');
    setShowSleepModal(false);
    setSleepInput({ bedtime: '', waketime: '', hours: '' });
  };

  const openSleepModal = () => {
    setSleepInput({
      bedtime: sleepLog?.sleep_time || '',
      waketime: sleepLog?.wake_time || '',
      hours: sleepLog?.duration_hours ? String(sleepLog.duration_hours) : '',
    });
    setShowSleepModal(true);
  };

  const calcSleepHours = (bed: string, wake: string): number | null => {
    if (!bed || !wake) return null;
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    if (isNaN(bh) || isNaN(wh)) return null;
    let diff = (wh * 60 + wm) - (bh * 60 + bm);
    if (diff < 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  const handleBedtimeChange = (value: string) => {
    const newBed = value;
    const auto = calcSleepHours(newBed, sleepInput.waketime);
    setSleepInput({ bedtime: newBed, waketime: sleepInput.waketime, hours: auto !== null ? String(auto) : sleepInput.hours });
  };

  const handleWaketimeChange = (value: string) => {
    const newWake = value;
    const auto = calcSleepHours(sleepInput.bedtime, newWake);
    setSleepInput({ bedtime: sleepInput.bedtime, waketime: newWake, hours: auto !== null ? String(auto) : sleepInput.hours });
  };

  const totals = sumNutrition(entries);
  const waterTotal = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0);
  const steps = stepLog?.steps || 0;
  const sleepHours = sleepLog?.duration_hours || 0;
  const workoutMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const mealEntries = (meal: string) => entries.filter((e) => e.meal === meal);
  const calorieTarget = profile?.calorie_target || 2000;
  const remaining = Math.max(0, Math.round(calorieTarget - totals.calories));
  const caloriePct = calorieTarget > 0 ? Math.min((totals.calories / calorieTarget) * 100, 100) : 0;

  const quickActions = [
    { label: 'Add Food', icon: Plus, page: 'add' as PageId, color: 'from-zinc-800 to-zinc-900' },
    { label: 'Scan', icon: Camera, page: 'scan' as PageId, color: 'from-zinc-700 to-zinc-800' },
    { label: 'AI Chat', icon: Bot, page: 'ai' as PageId, color: 'from-zinc-600 to-zinc-700' },
    { label: 'Progress', icon: TrendingUp, page: 'progress' as PageId, color: 'from-zinc-500 to-zinc-600' },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
        <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <div className="absolute inset-0 shimmer-bg" />
        </div>
        <div className="flex justify-center"><RingSkeleton /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
            {greeting}, {profile?.name || 'there'}!
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{format(new Date(selectedDate), 'EEEE, MMMM d')}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="input-field w-auto"
        />
      </motion.div>

      {/* Quick action bar */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <StaggerItem key={action.label}>
              <button
                onClick={() => onNavigate(action.page)}
                className={`w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-4 text-white shadow-soft hover:shadow-float transition-all hover:-translate-y-0.5 active:scale-[0.98]`}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Hero calorie card + macro overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-4"
      >
        {/* Calorie ring card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-float lg:col-span-3">
          <div className="absolute inset-0 bg-grid-light opacity-20" />
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full bg-accent-400/20 blur-2xl" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <CalorieRing consumed={totals.calories} target={calorieTarget} />
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/10 hover:bg-white/20 transition-colors">
                <p className="text-xs text-white/70">Consumed</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  <AnimatedCounter value={Math.round(totals.calories)} suffix=" kcal" />
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/10 hover:bg-white/20 transition-colors">
                <p className="text-xs text-white/70">Remaining</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  <AnimatedCounter value={remaining} suffix=" kcal" />
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/10 hover:bg-white/20 transition-colors">
                <p className="text-xs text-white/70">Target</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  <AnimatedCounter value={Math.round(calorieTarget)} suffix=" kcal" />
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/10 hover:bg-white/20 transition-colors">
                <p className="text-xs text-white/70">Items Logged</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  <AnimatedCounter value={entries.length} />
                </p>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="relative mt-5">
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${caloriePct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-white relative overflow-hidden"
              >
                <div className="absolute inset-0 shimmer-bg opacity-30" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-white/70">{caloriePct.toFixed(0)}% of goal</span>
              <span className="text-xs text-white/70 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {remaining > 0 ? `${remaining} kcal left` : 'Goal reached'}
              </span>
            </div>
          </div>
        </div>

        {/* Streak/achievement card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface-hover p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-zinc-900 dark:text-white">Today's Summary</h3>
                <p className="text-xs text-zinc-400">Your nutrition at a glance</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Protein', value: Math.round(totals.protein), target: profile?.protein_target || 150, unit: 'g' },
                { label: 'Carbs', value: Math.round(totals.carbs), target: profile?.carb_target || 200, unit: 'g' },
                { label: 'Fat', value: Math.round(totals.fat), target: profile?.fat_target || 65, unit: 'g' },
                { label: 'Fiber', value: Math.round(totals.fiber), target: profile?.fiber_target || 30, unit: 'g' },
              ].map((m) => {
                const pct = m.target > 0 ? Math.min((m.value / m.target) * 100, 100) : 0;
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-600 dark:text-zinc-400">{m.label}</span>
                      <span className="font-medium text-zinc-900 dark:text-white tabular-nums">{m.value}{m.unit} / {m.target}{m.unit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-brand-500 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 shimmer-bg opacity-30" />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macro cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><MacroCard label="Protein" current={totals.protein} target={profile?.protein_target || 150} unit="g" color="#18181b" /></StaggerItem>
        <StaggerItem><MacroCard label="Carbs" current={totals.carbs} target={profile?.carb_target || 200} unit="g" color="#3f3f46" /></StaggerItem>
        <StaggerItem><MacroCard label="Fat" current={totals.fat} target={profile?.fat_target || 65} unit="g" color="#52525b" /></StaggerItem>
        <StaggerItem><MacroCard label="Fiber" current={totals.fiber} target={profile?.fiber_target || 30} unit="g" color="#71717a" /></StaggerItem>
      </StaggerContainer>

      {/* Metric cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" stagger={0.05}>
        <StaggerItem><MetricCard icon="water" label="Water" current={waterTotal} target={profile?.water_target_ml || 3000} unit="ml" color="#18181b" /></StaggerItem>
        <StaggerItem><MetricCard icon="steps" label="Steps" current={steps} target={profile?.step_target || 10000} unit="" color="#3f3f46" /></StaggerItem>
        <StaggerItem><MetricCard icon="sleep" label="Sleep" current={sleepHours} target={0} unit="h" color="#52525b" /></StaggerItem>
        <StaggerItem><MetricCard icon="workout" label="Workout" current={workoutMinutes} target={60} unit="m" color="#71717a" /></StaggerItem>
      </StaggerContainer>

      {/* Water & Sleep quick-add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-surface p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Quick Add Water</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[250, 500, 750, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => addWater(amt)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 hover:border-brand-400 active:scale-95 transition-all"
              >
                <Droplet className="w-4 h-4" />
                +{amt >= 1000 ? `${amt / 1000}L` : `${amt}ml`}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="card-surface p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sleep Tracker</span>
            </div>
            {sleepLog && (
              <span className="text-xs font-medium text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                {sleepHours}h logged
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{sleepHours}h</span>
                <span className="text-sm text-zinc-400">slept today</span>
              </div>
              {sleepLog?.sleep_time && sleepLog?.wake_time ? (
                <p className="text-xs text-zinc-400 mt-1">
                  {sleepLog.sleep_time} - {sleepLog.wake_time}
                </p>
              ) : (
                <p className="text-xs text-zinc-400 mt-1">No sleep logged yet</p>
              )}
            </div>
            <button
              onClick={openSleepModal}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-float transition-all active:scale-95"
            >
              <Bed className="w-4 h-4" />
              {sleepLog ? 'Update' : 'Log Sleep'}
            </button>
          </div>
        </motion.div>
      </div>

      <Modal open={showSleepModal} onClose={() => setShowSleepModal(false)} title="Log Sleep" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Bedtime</label>
              <input
                type="time"
                value={sleepInput.bedtime}
                onChange={(e) => handleBedtimeChange(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Wake Time</label>
              <input
                type="time"
                value={sleepInput.waketime}
                onChange={(e) => handleWaketimeChange(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Hours Slept</label>
            <input
              type="number"
              value={sleepInput.hours}
              onChange={(e) => setSleepInput({ ...sleepInput, hours: e.target.value })}
              placeholder="e.g. 7.5"
              step="0.5"
              min="0"
              max="24"
              className="input-field"
            />
            <p className="text-xs text-zinc-400 mt-1.5">Hours auto-calculate from bedtime & wake time. You can also type it manually.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSleepModal(false)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={logSleep} className="flex-1 rounded-xl bg-brand-500 hover:bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-soft hover:shadow-float transition-all active:scale-[0.98]">
              Save Sleep
            </button>
          </div>
        </div>
      </Modal>

      {/* Meal sections - two column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MealSection title="Breakfast" meal="breakfast" entries={mealEntries('breakfast')} onAdd={onAddToMeal} onEdit={onEditEntry} onDelete={handleDelete} icon={<Coffee className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />} />
        <MealSection title="Lunch" meal="lunch" entries={mealEntries('lunch')} onAdd={onAddToMeal} onEdit={onEditEntry} onDelete={handleDelete} icon={<Sun className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />} />
        <MealSection title="Dinner" meal="dinner" entries={mealEntries('dinner')} onAdd={onAddToMeal} onEdit={onEditEntry} onDelete={handleDelete} icon={<Moon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />} />
        <MealSection title="Snacks" meal="snack" entries={mealEntries('snack')} onAdd={onAddToMeal} onEdit={onEditEntry} onDelete={handleDelete} icon={<UtensilsCrossed className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />} />
      </div>

      <button
        onClick={() => onNavigate('add')}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-float z-30 active:scale-90 transition-all glow-pulse"
        aria-label="Quick add food"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
