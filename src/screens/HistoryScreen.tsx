import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Droplet, Footprints, Moon, Dumbbell, Flame } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { sumNutrition } from '@/lib/nutrition';
import type { FoodEntry, WaterLog, StepLog, SleepLog, Workout } from '@/lib/types';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

export function HistoryScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [stepLog, setStepLog] = useState<StepLog | null>(null);
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [e, w, s, sl, wo] = await Promise.all([
      supabase.from('food_entries').select('*').eq('date', selectedDate).order('created_at'),
      supabase.from('water_logs').select('*').eq('date', selectedDate),
      supabase.from('step_logs').select('*').eq('date', selectedDate).maybeSingle(),
      supabase.from('sleep_logs').select('*').eq('date', selectedDate).maybeSingle(),
      supabase.from('workouts').select('*').eq('date', selectedDate),
    ]);
    setEntries((e.data as FoodEntry[]) || []);
    setWaterLogs((w.data as WaterLog[]) || []);
    setStepLog((s.data as StepLog) || null);
    setSleepLog((sl.data as SleepLog) || null);
    setWorkouts((wo.data as Workout[]) || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const totals = sumNutrition(entries);
  const waterTotal = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0);
  const date = new Date(selectedDate);
  const today = new Date();
  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const isFuture = date > today;

  const goBack = () => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'));
  const goForward = () => !isFuture && setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'));

  if (loading) return <div className="p-4 md:p-8"><LoadingSkeleton count={5} /></div>;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">History</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review your past nutrition data</p>
      </motion.div>

      <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-soft">
        <button onClick={goBack} className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors active:scale-90">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          <span className="font-medium text-zinc-900 dark:text-white">{format(date, 'EEEE, MMMM d, yyyy')}</span>
          {isToday && <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full font-medium">Today</span>}
        </div>
        <button onClick={goForward} disabled={isFuture} className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 transition-colors active:scale-90">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        max={format(today, 'yyyy-MM-dd')}
        className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
      />

      {entries.length === 0 && workouts.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8" />} title="No data for this date" description="Select another date or start tracking your food." />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-float"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5" />
                <p className="text-sm text-white/80">Calories</p>
              </div>
              <p className="text-4xl font-bold font-display">
                <AnimatedCounter value={Math.round(totals.calories)} />
                <span className="text-lg font-normal text-white/70"> / {Math.round(profile?.calorie_target || 2000).toLocaleString()} kcal</span>
              </p>
              <div className="grid grid-cols-4 gap-3 mt-5">
                <div className="rounded-xl bg-white/15 backdrop-blur-md p-3 text-center border border-white/10"><p className="text-xs text-white/70">Protein</p><p className="font-bold text-lg">{Math.round(totals.protein)}g</p></div>
                <div className="rounded-xl bg-white/15 backdrop-blur-md p-3 text-center border border-white/10"><p className="text-xs text-white/70">Carbs</p><p className="font-bold text-lg">{Math.round(totals.carbs)}g</p></div>
                <div className="rounded-xl bg-white/15 backdrop-blur-md p-3 text-center border border-white/10"><p className="text-xs text-white/70">Fat</p><p className="font-bold text-lg">{Math.round(totals.fat)}g</p></div>
                <div className="rounded-xl bg-white/15 backdrop-blur-md p-3 text-center border border-white/10"><p className="text-xs text-white/70">Fiber</p><p className="font-bold text-lg">{Math.round(totals.fiber)}g</p></div>
              </div>
            </div>
          </motion.div>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StaggerItem>
              <div className="card-surface-hover p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><Droplet className="w-5 h-5 text-brand-500" /></div>
                <div><p className="text-xs text-zinc-400">Water</p><p className="font-bold text-lg text-zinc-900 dark:text-white">{(waterTotal / 1000).toFixed(1)}L</p></div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-surface-hover p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><Footprints className="w-5 h-5 text-brand-500" /></div>
                <div><p className="text-xs text-zinc-400">Steps</p><p className="font-bold text-lg text-zinc-900 dark:text-white">{(stepLog?.steps || 0).toLocaleString()}</p></div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-surface-hover p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><Moon className="w-5 h-5 text-brand-500" /></div>
                <div><p className="text-xs text-zinc-400">Sleep</p><p className="font-bold text-lg text-zinc-900 dark:text-white">{sleepLog?.duration_hours || 0}h</p></div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-surface-hover p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-brand-500" /></div>
                <div><p className="text-xs text-zinc-400">Workouts</p><p className="font-bold text-lg text-zinc-900 dark:text-white">{workouts.length}</p></div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <StaggerContainer className="space-y-2">
            <h3 className="font-display font-semibold text-zinc-900 dark:text-white">Food Log</h3>
            {entries.map((e) => (
              <StaggerItem key={e.id}>
                <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card transition-all">
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{e.food_name}</p>
                    <p className="text-xs text-zinc-400 capitalize mt-0.5">{e.meal} · {e.quantity}{e.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{Math.round(e.calories)} kcal</p>
                    <p className="text-xs text-zinc-400">P:{Math.round(e.protein)} C:{Math.round(e.carbs)} F:{Math.round(e.fat)}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {workouts.length > 0 && (
            <StaggerContainer className="space-y-2">
              <h3 className="font-display font-semibold text-zinc-900 dark:text-white">Workouts</h3>
              {workouts.map((w) => (
                <StaggerItem key={w.id}>
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-all">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-zinc-900 dark:text-white">{w.name}</p>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full capitalize">{w.category}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{w.duration_minutes} min{w.notes ? ` · ${w.notes}` : ''}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </>
      )}
    </div>
  );
}
