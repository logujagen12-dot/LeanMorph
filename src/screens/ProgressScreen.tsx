import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { Flame, Droplet, Footprints, Moon, Dumbbell, TrendingDown, Award, Scale } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

type RangeKey = '7d' | '30d' | '90d' | '6m' | '1y';

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
  { key: '6m', label: '6 Months', days: 180 },
  { key: '1y', label: '1 Year', days: 365 },
];

export function ProgressScreen() {
  const { session } = useAuth();
  const [range, setRange] = useState<RangeKey>('7d');
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [weightData, setWeightData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const days = RANGES.find((r) => r.key === range)?.days || 7;
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const [entriesRes, weightRes, waterRes, stepsRes, sleepRes, workoutsRes] = await Promise.all([
      supabase.from('food_entries').select('*').gte('date', startDate).order('date'),
      supabase.from('weight_logs').select('*').gte('date', startDate).order('date'),
      supabase.from('water_logs').select('*').gte('date', startDate).order('date'),
      supabase.from('step_logs').select('*').gte('date', startDate).order('date'),
      supabase.from('sleep_logs').select('*').gte('date', startDate).order('date'),
      supabase.from('workouts').select('*').gte('date', startDate).order('date'),
    ]);

    const dayMap = new Map<string, { date: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; water: number; steps: number; sleep: number; workouts: number }>();
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayMap.set(d, { date: d, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
    }

    (entriesRes.data as Array<Record<string, unknown>>)?.forEach((e) => {
      const d = e.date as string;
      if (dayMap.has(d)) {
        const day = dayMap.get(d)!;
        day.calories += e.calories as number;
        day.protein += e.protein as number;
        day.carbs += e.carbs as number;
        day.fat += e.fat as number;
        day.fiber += e.fiber as number;
      }
    });

    (waterRes.data as Array<Record<string, unknown>>)?.forEach((w) => {
      const d = w.date as string;
      if (dayMap.has(d)) dayMap.get(d)!.water += w.amount_ml as number;
    });

    (stepsRes.data as Array<Record<string, unknown>>)?.forEach((s) => {
      const d = s.date as string;
      if (dayMap.has(d)) dayMap.get(d)!.steps += s.steps as number;
    });

    (sleepRes.data as Array<Record<string, unknown>>)?.forEach((s) => {
      const d = s.date as string;
      if (dayMap.has(d)) dayMap.get(d)!.sleep += s.duration_hours as number;
    });

    (workoutsRes.data as Array<Record<string, unknown>>)?.forEach((w) => {
      const d = w.date as string;
      if (dayMap.has(d)) dayMap.get(d)!.workouts += 1;
    });

    const sorted = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    setChartData(sorted);
    setWeightData((weightRes.data as Array<Record<string, unknown>>)?.map((w) => ({ date: w.date, weight: w.weight_kg })) || []);
    setLoading(false);
  }, [session?.user, range]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="p-4 md:p-8"><LoadingSkeleton count={4} /></div>;

  const chartProps = {
    data: chartData,
    margin: { top: 5, right: 5, bottom: 5, left: -20 },
  };

  const tooltipStyle = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '12px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  // Summary stats
  const totalCalories = chartData.reduce((sum, d) => sum + (d.calories as number), 0);
  const avgCalories = chartData.length > 0 ? totalCalories / chartData.length : 0;
  const totalWater = chartData.reduce((sum, d) => sum + (d.water as number), 0);
  const avgWater = chartData.length > 0 ? totalWater / chartData.length / 1000 : 0;
  const totalSteps = chartData.reduce((sum, d) => sum + (d.steps as number), 0);
  const avgSteps = chartData.length > 0 ? totalSteps / chartData.length : 0;
  const totalWorkouts = chartData.reduce((sum, d) => sum + (d.workouts as number), 0);
  const totalSleep = chartData.reduce((sum, d) => sum + (d.sleep as number), 0);
  const avgSleep = chartData.length > 0 ? totalSleep / chartData.length : 0;

  const summaryStats = [
    { label: 'Avg Calories', value: Math.round(avgCalories), unit: 'kcal', icon: Flame, color: '#18181b' },
    { label: 'Avg Water', value: avgWater, unit: 'L', decimals: 1, icon: Droplet, color: '#3f3f46' },
    { label: 'Avg Steps', value: Math.round(avgSteps), unit: '', icon: Footprints, color: '#52525b' },
    { label: 'Avg Sleep', value: avgSleep, unit: 'h', decimals: 1, icon: Moon, color: '#71717a' },
    { label: 'Workouts', value: totalWorkouts, unit: '', icon: Dumbbell, color: '#18181b' },
    { label: 'Days Tracked', value: chartData.length, unit: '', icon: Award, color: '#3f3f46' },
  ];

  const latestWeight = weightData.length > 0 ? (weightData[weightData.length - 1].weight as number) : 0;
  const firstWeight = weightData.length > 0 ? (weightData[0].weight as number) : 0;
  const weightChange = weightData.length > 0 ? Math.round((latestWeight - firstWeight) * 10) / 10 : 0;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Progress</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track your trends over time</p>
        </div>
        {weightData.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
            <Scale className="w-4 h-4 text-brand-500" />
            <span className="text-sm text-zinc-500">Weight change:</span>
            <span className={`font-bold text-sm ${weightChange < 0 ? 'text-success-500' : weightChange > 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange}kg
            </span>
          </div>
        )}
      </motion.div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`chip ${range === r.key ? 'chip-active' : 'chip-inactive'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary stat cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <div className="card-surface-hover p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                </div>
                <p className="font-display text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                  <AnimatedCounter value={stat.value} decimals={stat.decimals || 0} suffix={stat.unit} />
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <ChartCard title="Calories" subtitle="Daily intake over time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
            <Line type="monotone" dataKey="calories" stroke="#18181b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Macros" subtitle="Protein, carbs, fat (g)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Line type="monotone" dataKey="protein" stroke="#18181b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="carbs" stroke="#52525b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fat" stroke="#a1a1aa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weight" subtitle="Weight tracking (kg)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightData} margin={chartProps.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Line type="monotone" dataKey="weight" stroke="#18181b" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Water" subtitle="Daily intake (L)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={chartProps.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Bar dataKey="water" fill="#3f3f46" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Steps" subtitle="Daily step count">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={chartProps.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Bar dataKey="steps" fill="#18181b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sleep" subtitle="Hours per night">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={chartProps.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Bar dataKey="sleep" fill="#52525b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workouts" subtitle="Sessions per day">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={chartProps.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={(d: unknown) => format(new Date(d as string), 'M/d')} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: unknown) => format(new Date(d as string), 'MMM d')} />
              <Bar dataKey="workouts" fill="#71717a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card-surface p-5 hover:shadow-float transition-shadow"
    >
      <div className="mb-3">
        <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}
