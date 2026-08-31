import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Pencil, Save, X, Scale, Target, Activity, Calendar, TrendingDown, TrendingUp, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import type { WeightLog } from '@/lib/types';
import { format } from 'date-fns';

export function ProfileScreen() {
  const { profile, updateProfile, session } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: '', age: 25, gender: 'male', height_cm: 170, weight_kg: 70, target_weight_kg: 68,
    goal: 'maintain', activity_level: 'moderate', workout_frequency: 3,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        age: profile.age || 25,
        gender: profile.gender,
        height_cm: profile.height_cm || 170,
        weight_kg: profile.weight_kg || 70,
        target_weight_kg: profile.target_weight_kg || 68,
        goal: profile.goal,
        activity_level: profile.activity_level,
        workout_frequency: profile.workout_frequency || 3,
      });
    }
  }, [profile]);

  const loadWeightLogs = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(20);
    setWeightLogs((data as WeightLog[]) || []);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => { loadWeightLogs(); }, [loadWeightLogs]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: form.name,
        age: form.age,
        gender: form.gender,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        target_weight_kg: form.target_weight_kg,
        goal: form.goal,
        activity_level: form.activity_level,
        workout_frequency: form.workout_frequency,
      });
      showToast('Profile updated!', 'success');
      setEditing(false);
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Please choose an image smaller than 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
    if (uploadError) {
      showToast('Could not upload your profile picture', 'error');
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    try {
      await updateProfile({ avatar_url: data.publicUrl });
      showToast('Profile picture updated!', 'success');
    } catch {
      showToast('Could not save your profile picture', 'error');
    }
    setUploadingAvatar(false);
  };

  const logWeight = async () => {
    if (!session?.user || !newWeight) return;
    const { data, error } = await supabase.from('weight_logs').insert({
      user_id: session.user.id, weight_kg: parseFloat(newWeight), date: format(new Date(), 'yyyy-MM-dd'),
    }).select().single();
    if (error) { showToast(error.message, 'error'); return; }
    setWeightLogs((prev) => [data as WeightLog, ...prev]);
    setNewWeight('');
    showToast('Weight logged!', 'success');
  };

  if (!profile) return <div className="p-4"><LoadingSkeleton count={3} /></div>;

  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : (profile.weight_kg ?? 0);
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight_kg : (profile.weight_kg ?? 0);
  const weightChange = Math.round((currentWeight - startWeight) * 10) / 10;
  const isLosing = weightChange < 0;
  const isGaining = weightChange > 0;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your personal information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"><X className="w-4 h-4" /></button>
            <button onClick={handleSave} className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-float transition-all active:scale-95"><Save className="w-4 h-4" /> Save</button>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-float"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <label className="relative w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 overflow-hidden cursor-pointer group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Your profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10" />
            )}
            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="sr-only" disabled={uploadingAvatar} />
          </label>
          <div>
            <h2 className="text-2xl font-bold font-display">{profile.name || 'User'}</h2>
            <p className="text-sm text-white/80 capitalize mt-0.5">{profile.goal?.replace('_', ' ')} · {profile.activity_level?.replace('_', ' ')}</p>
            <p className="text-xs text-white/60 mt-1">Click your picture to change it</p>
          </div>
        </div>
      </motion.div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StaggerItem><StatCard icon={<Calendar className="w-5 h-5" />} label="Age" value={`${profile.age || '-'}`} /></StaggerItem>
        <StaggerItem><StatCard icon={<Scale className="w-5 h-5" />} label="Weight" value={`${profile.weight_kg || '-'} kg`} /></StaggerItem>
        <StaggerItem><StatCard icon={<Target className="w-5 h-5" />} label="Target" value={`${profile.target_weight_kg || '-'} kg`} /></StaggerItem>
        <StaggerItem><StatCard icon={<UserIcon className="w-5 h-5" />} label="Height" value={`${profile.height_cm || '-'} cm`} /></StaggerItem>
        <StaggerItem><StatCard icon={<Activity className="w-5 h-5" />} label="Workouts/wk" value={`${profile.workout_frequency || 0}`} /></StaggerItem>
        <StaggerItem><StatCard icon={<Target className="w-5 h-5" />} label="Calories" value={`${Math.round(profile.calorie_target || 0)}`} /></StaggerItem>
      </StaggerContainer>

      {editing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card-surface p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'age', label: 'Age', type: 'number' },
              { key: 'height_cm', label: 'Height (cm)', type: 'number' },
              { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
              { key: 'target_weight_kg', label: 'Target Weight (kg)', type: 'number' },
              { key: 'workout_frequency', label: 'Workout Frequency', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as Record<string, unknown>)[f.key] as string | number} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} className="input-field" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Goal</label>
              <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="input-field">
                <option value="lose">Lose Weight</option><option value="maintain">Maintain</option><option value="gain">Gain Weight</option><option value="build_muscle">Build Muscle</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Activity Level</label>
              <select value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })} className="input-field">
                <option value="sedentary">Sedentary</option><option value="light">Lightly Active</option><option value="moderate">Moderately Active</option><option value="very_active">Very Active</option><option value="athlete">Athlete</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-surface p-5"
      >
        <h3 className="font-display font-semibold text-zinc-900 dark:text-white mb-4">Weight Tracking</h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-400 mb-1">Starting</p>
            <p className="font-display text-xl font-bold text-zinc-900 dark:text-white">{startWeight}kg</p>
          </div>
          <div className="text-center rounded-2xl bg-brand-500/10 p-4">
            <p className="text-xs text-brand-500 mb-1">Current</p>
            <p className="font-display text-xl font-bold text-brand-500">
              <AnimatedCounter value={currentWeight} suffix="kg" />
            </p>
          </div>
          <div className="text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-400 mb-1">Change</p>
            <p className={`font-display text-xl font-bold flex items-center justify-center gap-1 ${isLosing ? 'text-success-500' : isGaining ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
              {isLosing ? <TrendingDown className="w-4 h-4" /> : isGaining ? <TrendingUp className="w-4 h-4" /> : null}
              {weightChange > 0 ? '+' : ''}{weightChange}kg
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Log today's weight (kg)" className="input-field flex-1" />
          <button onClick={logWeight} className="rounded-xl bg-brand-500 hover:bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-float transition-all active:scale-95">Log</button>
        </div>
        {loading ? <LoadingSkeleton count={3} /> : weightLogs.length > 0 && (
          <div className="mt-4 space-y-1">
            {weightLogs.slice(0, 10).map((w) => (
              <div key={w.id} className="flex justify-between text-sm py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <span className="text-zinc-500">{format(new Date(w.date), 'MMM d, yyyy')}</span>
                <span className="font-medium text-zinc-900 dark:text-white">{w.weight_kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-surface-hover p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">{icon}</div>
      <div><p className="text-xs text-zinc-400">{label}</p><p className="font-display font-bold text-zinc-900 dark:text-white">{value}</p></div>
    </div>
  );
}
