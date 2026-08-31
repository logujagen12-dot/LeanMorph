export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type GoalType = 'lose' | 'maintain' | 'gain' | 'build_muscle';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';

export type Gender = 'male' | 'female' | 'other';

export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'piece' | 'cup' | 'tbsp' | 'tsp';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  gender: string;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  goal: string;
  activity_level: string;
  workout_frequency: number;
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  fiber_target: number;
  water_target_ml: number;
  step_target: number;
  sleep_target_hours: number;
  dark_mode: boolean;
  units: string;
  notifications_enabled: boolean;
  language: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  serving_size: number;
  serving_unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  meal: string;
  food_id: string | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  date: string;
  created_at: string;
}

export interface StepLog {
  id: string;
  user_id: string;
  steps: number;
  date: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_time: string | null;
  wake_time: string | null;
  duration_hours: number;
  date: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  category: string;
  duration_minutes: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface SavedMeal {
  id: string;
  user_id: string;
  name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  created_at: string;
}

export interface SavedMealItem {
  id: string;
  saved_meal_id: string;
  food_id: string | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  created_at: string;
}

export interface FavoriteFood {
  id: string;
  user_id: string;
  food_id: string | null;
  food_name: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked: boolean;
  progress: number;
  unlocked_at: string | null;
  created_at: string;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface AIDetectedFood {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
