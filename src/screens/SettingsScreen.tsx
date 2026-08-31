import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Bell, Globe, Shield, Download, Trash2, LogOut, Target, Droplet, Footprints, Moon as MoonIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function SettingsScreen() {
  const { profile, updateProfile, signOut, session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [targets, setTargets] = useState({
    calorie_target: 2000, protein_target: 150, carb_target: 200, fat_target: 65, fiber_target: 30,
    water_target_ml: 3000, step_target: 10000, sleep_target_hours: 8,
  });

  useEffect(() => {
    if (profile) {
      setTargets({
        calorie_target: profile.calorie_target || 2000,
        protein_target: profile.protein_target || 150,
        carb_target: profile.carb_target || 200,
        fat_target: profile.fat_target || 65,
        fiber_target: profile.fiber_target || 30,
        water_target_ml: profile.water_target_ml || 3000,
        step_target: profile.step_target || 10000,
        sleep_target_hours: profile.sleep_target_hours || 8,
      });
    }
  }, [profile]);

  const saveTargets = useCallback(async () => {
    try {
      await updateProfile(targets);
      showToast('Targets updated!', 'success');
    } catch { showToast('Failed to update targets', 'error'); }
  }, [targets, updateProfile, showToast]);

  const handleDeleteAccount = async () => {
    if (!session?.user) return;
    setShowDeleteConfirm(false);
    // Delete all user data
    const tables = ['food_entries', 'weight_logs', 'water_logs', 'step_logs', 'sleep_logs', 'workouts', 'saved_meals', 'favorite_foods', 'food_search_history', 'ai_messages', 'ai_conversations', 'user_achievements', 'user_profiles'];
    for (const t of tables) {
      await supabase.from(t).delete().eq('user_id', session.user.id);
    }
    await signOut();
    showToast('Account data deleted', 'success');
  };

  const exportCSV = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('food_entries').select('*').eq('user_id', session.user.id).order('date', { ascending: false });
    if (!data || data.length === 0) { showToast('No data to export', 'info'); return; }
    const headers = ['Date', 'Meal', 'Food', 'Quantity', 'Unit', 'Calories', 'Protein', 'Carbs', 'Fat', 'Fiber'];
    const rows = data.map((e) => [e.date, e.meal, e.food_name, e.quantity, e.unit, e.calories, e.protein, e.carbs, e.fat, e.fiber]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nutrition-export.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
  };

  const exportPDF = async () => {
    if (!session?.user) return;
    const { data: entries } = await supabase.from('food_entries').select('*').eq('user_id', session.user.id).order('date', { ascending: false });
    if (!entries || entries.length === 0) { showToast('No data to export', 'info'); return; }
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = entries.map((e) => `<tr><td>${e.date}</td><td>${e.meal}</td><td>${e.food_name}</td><td>${e.quantity}${e.unit}</td><td>${Math.round(e.calories)}</td><td>${Math.round(e.protein)}g</td><td>${Math.round(e.carbs)}g</td><td>${Math.round(e.fat)}g</td><td>${Math.round(e.fiber)}g</td></tr>`).join('');
    win.document.write(`<html><head><title>Nutrition Report</title><style>body{font-family:Arial;padding:40px}h1{color:#22c55e}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f5}</style></head><body><h1>Nutrition Report</h1><p>Generated: ${new Date().toLocaleDateString()}</p><table><tr><th>Date</th><th>Meal</th><th>Food</th><th>Qty</th><th>Cal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Fiber</th></tr>${rows}</table></body></html>`);
    win.document.close();
    win.print();
    showToast('PDF export opened!', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-24 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>

      <Section title="Daily Targets" icon={<Target className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'calorie_target', label: 'Calories', unit: 'kcal' },
            { key: 'protein_target', label: 'Protein', unit: 'g' },
            { key: 'carb_target', label: 'Carbs', unit: 'g' },
            { key: 'fat_target', label: 'Fat', unit: 'g' },
            { key: 'fiber_target', label: 'Fiber', unit: 'g' },
            { key: 'water_target_ml', label: 'Water', unit: 'ml' },
            { key: 'step_target', label: 'Steps', unit: '' },
            { key: 'sleep_target_hours', label: 'Sleep', unit: 'h' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs text-zinc-400 mb-1 block">{f.label}</label>
              <div className="flex items-center gap-1">
                <input type="number" value={targets[f.key as keyof typeof targets] as number} onChange={(e) => setTargets({ ...targets, [f.key]: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <span className="text-xs text-zinc-400">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveTargets} className="mt-3 w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-2.5 text-sm font-semibold text-white">Save Targets</button>
      </Section>

      <Section title="Appearance" icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}>
        <ToggleRow icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} label="Dark Mode" checked={theme === 'dark'} onChange={toggleTheme} />
      </Section>

      <Section title="App Settings" icon={<Bell className="w-5 h-5" />}>
        <ToggleRow icon={<Bell className="w-5 h-5" />} label="Notifications" checked={profile?.notifications_enabled ?? true} onChange={async (v) => { await updateProfile({ notifications_enabled: v }); }} />
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-zinc-400" /><span className="text-sm text-zinc-700 dark:text-zinc-300">Language</span></div>
          <select value={profile?.language || 'en'} onChange={async (e) => { await updateProfile({ language: e.target.value }); }} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-white">
            <option value="en">English</option><option value="es">Spanish</option><option value="hi">Hindi</option><option value="ta">Tamil</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-zinc-400" /><span className="text-sm text-zinc-700 dark:text-zinc-300">Units</span></div>
          <select value={profile?.units || 'metric'} onChange={async (e) => { await updateProfile({ units: e.target.value }); }} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-white">
            <option value="metric">Metric (kg, cm)</option><option value="imperial">Imperial (lb, ft)</option>
          </select>
        </div>
      </Section>

      <Section title="Export Data" icon={<Download className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportCSV} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Download className="w-4 h-4" /> CSV Export
          </button>
          <button onClick={exportPDF} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Download className="w-4 h-4" /> PDF Export
          </button>
        </div>
      </Section>

      <Section title="Account" icon={<LogOut className="w-5 h-5" />}>
        <button onClick={signOut} className="w-full flex items-center gap-2 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-3">
          <LogOut className="w-5 h-5" /> Logout
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-2 py-3 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-3">
          <Trash2 className="w-5 h-5" /> Delete Account
        </button>
      </Section>

      <ConfirmDialog open={showDeleteConfirm} title="Delete Account?" message="This will permanently delete all your nutrition data. This cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteConfirm(false)} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-3"><span className="text-brand-500">{icon}</span><h3 className="font-semibold text-zinc-900 dark:text-white">{title}</h3></div>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2"><span className="text-zinc-400">{icon}</span><span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span></div>
      <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
