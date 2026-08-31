import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { calculateTargets } from '@/lib/nutrition';
import type { ActivityLevel, GoalType, Gender } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const STEPS = ['Welcome', 'About You', 'Your Goals', 'Activity', 'Targets'];

const GOALS: { id: GoalType; label: string; desc: string; emoji: string }[] = [
  { id: 'lose', label: 'Lose Weight', desc: 'Create a calorie deficit', emoji: '🔥' },
  { id: 'maintain', label: 'Maintain Weight', desc: 'Stay at your current weight', emoji: '⚖️' },
  { id: 'gain', label: 'Gain Weight', desc: 'Build a calorie surplus', emoji: '💪' },
  { id: 'build_muscle', label: 'Build Muscle', desc: 'High protein for muscle growth', emoji: '🏋️' },
];

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; desc: string }[] = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { id: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
  { id: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { id: 'athlete', label: 'Athlete', desc: 'Training twice per day' },
];

export function OnboardingScreen() {
  const { session, refreshProfile, setLocalProfile } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    age: 25,
    gender: 'male' as Gender,
    heightCm: 170,
    weightKg: 70,
    targetWeightKg: 68,
    goal: 'maintain' as GoalType,
    activityLevel: 'moderate' as ActivityLevel,
    workoutFrequency: 3,
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    if (!session?.user) return;
    setLoading(true);
    const targets = calculateTargets({
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      age: data.age,
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal,
    });

    const profileData = {
      user_id: session.user.id,
      name: data.name || session.user.email?.split('@')[0] || 'User',
      age: data.age,
      gender: data.gender,
      height_cm: data.heightCm,
      weight_kg: data.weightKg,
      target_weight_kg: data.targetWeightKg,
      goal: data.goal,
      activity_level: data.activityLevel,
      workout_frequency: data.workoutFrequency,
      onboarding_completed: true,
      ...targets,
    };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving profile:', error);
      }
    } catch (err) {
      console.error('Exception saving profile:', err);
    }

    setLoading(false);
    // Instantly transition to dashboard with local profile state
    setLocalProfile(profileData as any);
    showToast('Profile set up successfully!', 'success');
    refreshProfile().catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-brand-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-zinc-400/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Step {step + 1} of {STEPS.length}</span>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i <= step ? 24 : 6 }}
                className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 min-h-[400px] shadow-card dark:shadow-card-dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (
                <div className="flex flex-col items-center text-center py-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-4 shadow-float"
                  >
                    <UserIcon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-2">Welcome to LeanMorph!</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Let's set up your profile to personalize your nutrition targets. This takes about a minute.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-4">About You</h2>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      placeholder="Enter your name"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Age</label>
                    <input
                      type="number"
                      value={data.age}
                      onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Gender</label>
                    <div className="flex gap-2">
                      {(['male', 'female', 'other'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setData({ ...data, gender: g })}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                            data.gender === g
                              ? 'bg-brand-500 text-white shadow-soft'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Height (cm)</label>
                      <input
                        type="number"
                        value={data.heightCm}
                        onChange={(e) => setData({ ...data, heightCm: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Weight (kg)</label>
                      <input
                        type="number"
                        value={data.weightKg}
                        onChange={(e) => setData({ ...data, weightKg: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-4">What's Your Goal?</h2>
                  <div className="space-y-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setData({ ...data, goal: g.id })}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          data.goal === g.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-soft'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{g.emoji}</span>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">{g.label}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{g.desc}</p>
                            </div>
                          </div>
                          {data.goal === g.id && <Check className="w-5 h-5 text-brand-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Target Weight (kg)</label>
                    <input
                      type="number"
                      value={data.targetWeightKg}
                      onChange={(e) => setData({ ...data, targetWeightKg: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-4">Activity Level</h2>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setData({ ...data, activityLevel: a.id })}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          data.activityLevel === a.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-soft'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{a.label}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.desc}</p>
                          </div>
                          {data.activityLevel === a.id && <Check className="w-5 h-5 text-brand-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Workout Frequency (days/week)</label>
                    <input
                      type="range"
                      min={0}
                      max={7}
                      value={data.workoutFrequency}
                      onChange={(e) => setData({ ...data, workoutFrequency: parseInt(e.target.value) })}
                      className="w-full accent-brand-500"
                    />
                    <div className="text-center text-sm text-zinc-500 mt-1 font-medium">{data.workoutFrequency} days/week</div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-4">Your Daily Targets</h2>
                  {(() => {
                    const t = calculateTargets({
                      weightKg: data.weightKg,
                      heightCm: data.heightCm,
                      age: data.age,
                      gender: data.gender,
                      activityLevel: data.activityLevel,
                      goal: data.goal,
                    });
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Calories', value: `${t.calorie_target} kcal`, color: 'text-zinc-900 dark:text-white' },
                            { label: 'Protein', value: `${t.protein_target} g`, color: 'text-zinc-900 dark:text-white' },
                            { label: 'Carbs', value: `${t.carb_target} g`, color: 'text-zinc-900 dark:text-white' },
                            { label: 'Fat', value: `${t.fat_target} g`, color: 'text-zinc-900 dark:text-white' },
                            { label: 'Fiber', value: `${t.fiber_target} g`, color: 'text-zinc-900 dark:text-white' },
                            { label: 'Water', value: `${(t.water_target_ml / 1000).toFixed(1)} L`, color: 'text-zinc-900 dark:text-white' },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-100 dark:border-zinc-800">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</p>
                              <p className={`font-display text-lg font-bold ${item.color}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3 border border-brand-100 dark:border-brand-800/30">
                          <p className="text-xs text-brand-700 dark:text-brand-400">
                            BMR: {t.bmr} kcal · TDEE: {t.tdee} kcal · Steps: {t.step_target.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-zinc-400 text-center">
                          You can adjust these targets later in Settings.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={prev}
                className="btn-secondary flex items-center gap-1.5 px-4 py-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-3"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-3"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Get Started <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
