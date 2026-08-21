# NutriTrack AI - Smart Nutrition Tracking

A polished, production-ready AI-powered calorie and nutrition tracking app. Track meals, scan food with AI, chat with a nutrition assistant, monitor progress with charts, and manage your health goals.

## Features

- **Authentication**: Email/password sign up, login, logout with persistent sessions
- **Onboarding**: Multi-step flow collecting age, gender, height, weight, activity level, and goals. Automatically calculates BMR, TDEE, calorie/macro/water/step targets
- **Home Dashboard**: Animated calorie ring, macro cards (protein, carbs, fat, fiber), water/steps/sleep/workout tracking
- **Meal Tracking**: Breakfast, lunch, dinner, snacks with add/edit/delete. Daily totals update instantly
- **Food Database**: 39+ pre-loaded foods including Indian, South Indian, fruits, vegetables, dairy, chicken, fish, and more. Search with debounced filtering
- **Custom Foods**: Create your own food entries with per-serving nutrition
- **AI Food Scanner**: Upload a photo, AI estimates food name, serving size, calories, and macros. Edit before saving
- **AI Natural Language Entry**: Type descriptions like "50g oats with 250ml milk and one banana" — AI parses individual foods and quantities
- **AI Nutrition Assistant**: Chat assistant that uses your actual database data to answer questions about your intake
- **History**: Calendar date selector to view any past day's nutrition, water, steps, sleep, and workouts
- **Progress Charts**: Recharts-powered visualizations for calories, macros, weight, water, steps, sleep, and workouts with 7d/30d/90d/6m/1y filters
- **Weight Tracking**: Log weight, view starting/current/target/change
- **Water Tracking**: Quick-add buttons for 250ml/500ml/750ml/1L
- **Saved Meals**: Create reusable meal templates with auto-calculated nutrition. One-tap add to any meal
- **Favorites**: Save favorite foods for quick access
- **Export**: CSV and PDF export of all nutrition data
- **Settings**: Edit all daily targets, toggle dark/light mode, change units, language, notifications
- **Dark/Light Mode**: Full theme support with smooth transitions
- **Responsive**: Mobile-first design with bottom navigation on mobile, sidebar on desktop

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React icons
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **AI**: OpenAI API via Supabase Edge Functions (with fallback when no API key configured)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

The app uses Supabase (PostgreSQL) with the following tables:

| Table | Purpose |
|-------|---------|
| `user_profiles` | Onboarding data, calculated nutrition targets |
| `foods` | Shared food database + user custom foods |
| `food_entries` | Daily food log entries (core tracking) |
| `weight_logs` | Weight history |
| `water_logs` | Daily water intake |
| `step_logs` | Daily step counts |
| `sleep_logs` | Sleep/wake times and duration |
| `workouts` | Workout entries |
| `saved_meals` | Reusable meal templates |
| `saved_meal_items` | Ingredients in saved meals |
| `favorite_foods` | User's favorited foods |
| `food_search_history` | Recent search queries |
| `ai_conversations` | AI chat sessions |
| `ai_messages` | Individual AI messages |
| `achievements` | Achievement definitions |
| `user_achievements` | Per-user achievement progress |

All tables have Row Level Security (RLS) enabled. Each user can only access their own data.

## AI Configuration

The app includes two edge functions:

1. **ai-food-analysis**: Analyzes food images and natural language descriptions
2. **ai-chat**: Nutrition assistant that uses your actual data

To enable OpenAI integration, set the `OPENAI_API_KEY` as a Supabase Edge Function secret. Without it, the app uses built-in fallback logic that still provides useful responses.

## Nutrition Calculations

- BMR calculated using the Mifflin-St Jeor equation
- TDEE = BMR × activity multiplier
- Calorie targets adjusted based on goal (lose: -500, gain: +400, build muscle: +300)
- Macro targets calculated from calorie target and goal-specific ratios
- All food nutrition computed from per-100g values: `total = per_100g × quantity / 100`

## License

This project is for educational/demonstration purposes.
