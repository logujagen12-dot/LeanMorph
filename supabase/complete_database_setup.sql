-- =========================================================
-- LEANMORPH COMPLETE DATABASE SETUP SCRIPT
-- =========================================================

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text,
  age int,
  gender text DEFAULT 'male',
  height_cm numeric,
  weight_kg numeric,
  target_weight_kg numeric,
  goal text DEFAULT 'maintain',
  activity_level text DEFAULT 'sedentary',
  workout_frequency int DEFAULT 3,
  bmr numeric DEFAULT 0,
  tdee numeric DEFAULT 0,
  calorie_target numeric DEFAULT 2000,
  protein_target numeric DEFAULT 150,
  carb_target numeric DEFAULT 200,
  fat_target numeric DEFAULT 65,
  fiber_target numeric DEFAULT 30,
  water_target_ml numeric DEFAULT 3000,
  step_target int DEFAULT 10000,
  sleep_target_hours numeric DEFAULT 8,
  dark_mode boolean DEFAULT true,
  units text DEFAULT 'metric',
  notifications_enabled boolean DEFAULT true,
  language text DEFAULT 'en',
  avatar_url text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO  
DECLARE pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' 
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname); END LOOP; 
END ;

CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. FOODS TABLE
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  serving_size numeric DEFAULT 100,
  serving_unit text DEFAULT 'g',
  calories_per_100g numeric NOT NULL DEFAULT 0,
  protein_per_100g numeric NOT NULL DEFAULT 0,
  carbs_per_100g numeric NOT NULL DEFAULT 0,
  fat_per_100g numeric NOT NULL DEFAULT 0,
  fiber_per_100g numeric NOT NULL DEFAULT 0,
  is_custom boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_all_foods" ON foods;
CREATE POLICY "select_all_foods" ON foods FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_foods" ON foods;
CREATE POLICY "insert_foods" ON foods FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_foods" ON foods;
CREATE POLICY "update_own_foods" ON foods FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_own_foods" ON foods;
CREATE POLICY "delete_own_foods" ON foods FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

-- 3. FOOD ENTRIES TABLE
CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal text NOT NULL DEFAULT 'breakfast',
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'g',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_entries" ON food_entries;
CREATE POLICY "select_own_entries" ON food_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_entries" ON food_entries;
CREATE POLICY "insert_own_entries" ON food_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_entries" ON food_entries;
CREATE POLICY "update_own_entries" ON food_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_entries" ON food_entries;
CREATE POLICY "delete_own_entries" ON food_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON food_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_created ON food_entries(created_at);

-- 4. WEIGHT LOGS
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_weight" ON weight_logs;
CREATE POLICY "select_own_weight" ON weight_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weight" ON weight_logs;
CREATE POLICY "insert_own_weight" ON weight_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weight" ON weight_logs;
CREATE POLICY "update_own_weight" ON weight_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weight" ON weight_logs;
CREATE POLICY "delete_own_weight" ON weight_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_logs(user_id, date);

-- 5. WATER LOGS
CREATE TABLE IF NOT EXISTS water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_water" ON water_logs;
CREATE POLICY "select_own_water" ON water_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_water" ON water_logs;
CREATE POLICY "insert_own_water" ON water_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_water" ON water_logs;
CREATE POLICY "update_own_water" ON water_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_water" ON water_logs;
CREATE POLICY "delete_own_water" ON water_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs(user_id, date);

-- 6. STEP LOGS
CREATE TABLE IF NOT EXISTS step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  steps int NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_steps" ON step_logs;
CREATE POLICY "select_own_steps" ON step_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_steps" ON step_logs;
CREATE POLICY "insert_own_steps" ON step_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_steps" ON step_logs;
CREATE POLICY "update_own_steps" ON step_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_steps" ON step_logs;
CREATE POLICY "delete_own_steps" ON step_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_steps_user_date ON step_logs(user_id, date);

-- 7. SLEEP LOGS
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_time timestamptz,
  wake_time timestamptz,
  duration_hours numeric DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_sleep" ON sleep_logs;
CREATE POLICY "select_own_sleep" ON sleep_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sleep" ON sleep_logs;
CREATE POLICY "insert_own_sleep" ON sleep_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sleep" ON sleep_logs;
CREATE POLICY "update_own_sleep" ON sleep_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sleep" ON sleep_logs;
CREATE POLICY "delete_own_sleep" ON sleep_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON sleep_logs(user_id, date);

-- 8. WORKOUTS
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'full_body',
  duration_minutes int DEFAULT 30,
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_workouts" ON workouts;
CREATE POLICY "select_own_workouts" ON workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workouts" ON workouts;
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workouts" ON workouts;
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workouts" ON workouts;
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);

-- 9. SAVED MEALS
CREATE TABLE IF NOT EXISTS saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_saved_meals" ON saved_meals;
CREATE POLICY "select_own_saved_meals" ON saved_meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_saved_meals" ON saved_meals;
CREATE POLICY "insert_own_saved_meals" ON saved_meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_saved_meals" ON saved_meals;
CREATE POLICY "update_own_saved_meals" ON saved_meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_saved_meals" ON saved_meals;
CREATE POLICY "delete_own_saved_meals" ON saved_meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS saved_meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id uuid NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'g',
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saved_meal_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_saved_meal_items" ON saved_meal_items;
CREATE POLICY "select_own_saved_meal_items" ON saved_meal_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM saved_meals WHERE saved_meals.id = saved_meal_items.saved_meal_id AND saved_meals.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_saved_meal_items" ON saved_meal_items;
CREATE POLICY "insert_own_saved_meal_items" ON saved_meal_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM saved_meals WHERE saved_meals.id = saved_meal_items.saved_meal_id AND saved_meals.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_saved_meal_items" ON saved_meal_items;
CREATE POLICY "delete_own_saved_meal_items" ON saved_meal_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM saved_meals WHERE saved_meals.id = saved_meal_items.saved_meal_id AND saved_meals.user_id = auth.uid()));

-- 10. FAVORITES & SEARCH HISTORY
CREATE TABLE IF NOT EXISTS favorite_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_favorites" ON favorite_foods;
CREATE POLICY "select_own_favorites" ON favorite_foods FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_favorites" ON favorite_foods;
CREATE POLICY "insert_own_favorites" ON favorite_foods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_favorites" ON favorite_foods;
CREATE POLICY "delete_own_favorites" ON favorite_foods FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS food_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE food_search_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_search_history" ON food_search_history;
CREATE POLICY "select_own_search_history" ON food_search_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_search_history" ON food_search_history;
CREATE POLICY "insert_own_search_history" ON food_search_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_search_history" ON food_search_history;
CREATE POLICY "delete_own_search_history" ON food_search_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_conversations" ON ai_conversations;
CREATE POLICY "select_own_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_conversations" ON ai_conversations;
CREATE POLICY "insert_own_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_conversations" ON ai_conversations;
CREATE POLICY "delete_own_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_messages" ON ai_messages;
CREATE POLICY "select_own_messages" ON ai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_messages" ON ai_messages;
CREATE POLICY "insert_own_messages" ON ai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_messages" ON ai_messages;
CREATE POLICY "delete_own_messages" ON ai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_messages(conversation_id);

-- 12. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'award',
  category text DEFAULT 'general'
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_all_achievements" ON achievements;
CREATE POLICY "select_all_achievements" ON achievements FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  progress numeric DEFAULT 0,
  unlocked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_user_achievements" ON user_achievements;
CREATE POLICY "select_own_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_achievements" ON user_achievements;
CREATE POLICY "insert_own_user_achievements" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_achievements" ON user_achievements;
CREATE POLICY "update_own_user_achievements" ON user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_achievements" ON user_achievements;
CREATE POLICY "delete_own_user_achievements" ON user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 13. STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public avatar images are viewable" ON storage.objects;
CREATE POLICY "Public avatar images are viewable" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload their own avatars" ON storage.objects;
CREATE POLICY "Users upload their own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users update their own avatars" ON storage.objects;
CREATE POLICY "Users update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users delete their own avatars" ON storage.objects;
CREATE POLICY "Users delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 14. SEED INITIAL FOODS
INSERT INTO foods (name, category, serving_size, serving_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_custom) VALUES
('Chicken Breast (Cooked)', 'protein', 100, 'g', 165, 31.0, 0.0, 3.6, 0.0, false),
('Boiled Egg', 'protein', 50, 'piece', 155, 12.6, 1.1, 10.6, 0.0, false),
('Paneer (Cottage Cheese)', 'dairy', 100, 'g', 296, 18.3, 4.5, 22.0, 0.0, false),
('Greek Yogurt (Plain)', 'dairy', 100, 'g', 59, 10.0, 3.6, 0.4, 0.0, false),
('Cow Milk (Whole)', 'dairy', 250, 'ml', 61, 3.2, 4.8, 3.3, 0.0, false),
('White Rice (Cooked)', 'grains', 150, 'g', 130, 2.7, 28.2, 0.3, 0.4, false),
('Brown Rice (Cooked)', 'grains', 150, 'g', 111, 2.6, 23.0, 0.9, 1.8, false),
('Rolled Oats (Raw)', 'grains', 50, 'g', 389, 16.9, 66.3, 6.9, 10.6, false),
('Whole Wheat Roti / Chapati', 'grains', 40, 'piece', 264, 9.0, 52.0, 3.0, 9.0, false),
('Yellow Dal (Cooked Tadka)', 'grains', 150, 'g', 115, 6.8, 15.2, 3.1, 4.2, false),
('Plain Dosa', 'grains', 80, 'piece', 168, 3.9, 29.0, 3.7, 1.4, false),
('Idli (Steamed)', 'grains', 60, 'piece', 132, 4.0, 28.0, 0.5, 1.5, false),
('Banana', 'fruits', 120, 'piece', 89, 1.1, 22.8, 0.3, 2.6, false),
('Apple (with skin)', 'fruits', 150, 'piece', 52, 0.3, 13.8, 0.2, 2.4, false),
('Almonds', 'nuts', 30, 'g', 579, 21.2, 21.6, 49.9, 12.5, false),
('Peanut Butter (Smooth)', 'nuts', 32, 'tbsp', 588, 25.1, 20.0, 50.4, 6.0, false),
('Whey Protein Powder', 'supplements', 30, 'scoop', 390, 80.0, 6.0, 4.0, 1.0, false),
('Broccoli (Steamed)', 'vegetables', 100, 'g', 35, 2.4, 7.2, 0.4, 2.6, false),
('Spinach (Raw)', 'vegetables', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2, false),
('Sweet Potato (Baked)', 'vegetables', 150, 'g', 90, 2.0, 20.7, 0.2, 3.3, false),
('Salmon (Grilled)', 'protein', 150, 'g', 206, 22.1, 0.0, 12.3, 0.0, false)
ON CONFLICT DO NOTHING;

-- 15. SEED ACHIEVEMENTS
INSERT INTO achievements (key, title, description, icon, category) VALUES
('first_meal', 'First Step', 'Log your very first meal', 'utensils', 'nutrition'),
('perfect_day', 'Bullseye', 'Hit your calorie target within ±50 kcal', 'target', 'nutrition'),
('protein_power', 'Protein Champion', 'Hit your daily protein target', 'dumbbell', 'nutrition'),
('streak_3', 'On a Roll', 'Maintain a 3-day tracking streak', 'flame', 'streak'),
('streak_7', 'Week Warrior', 'Track all meals for 7 consecutive days', 'zap', 'streak'),
('water_goal', 'Hydrated', 'Hit your daily water intake goal', 'droplet', 'wellness'),
('first_scan', 'AI Visionary', 'Scan a meal using AI food scanner', 'camera', 'ai')
ON CONFLICT (key) DO NOTHING;
