import type { ActivityLevel, GoalType, Gender } from './types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base + 5);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}

export function calculateCalorieTarget(
  tdee: number,
  goal: GoalType
): number {
  switch (goal) {
    case 'lose':
      return Math.max(1200, Math.round(tdee - 500));
    case 'gain':
      return Math.round(tdee + 400);
    case 'build_muscle':
      return Math.round(tdee + 300);
    case 'maintain':
    default:
      return tdee;
  }
}

export function calculateMacroTargets(
  calorieTarget: number,
  weightKg: number,
  goal: GoalType
): { protein: number; carbs: number; fat: number; fiber: number } {
  let proteinPerKg = 1.6;
  let fatPct = 0.25;
  let carbPct = 0.5;

  switch (goal) {
    case 'lose':
      proteinPerKg = 2.0;
      fatPct = 0.25;
      carbPct = 0.45;
      break;
    case 'gain':
      proteinPerKg = 1.8;
      fatPct = 0.25;
      carbPct = 0.5;
      break;
    case 'build_muscle':
      proteinPerKg = 2.2;
      fatPct = 0.25;
      carbPct = 0.5;
      break;
    case 'maintain':
    default:
      proteinPerKg = 1.6;
      fatPct = 0.27;
      carbPct = 0.48;
      break;
  }

  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calorieTarget * fatPct) / 9);
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbCalories = calorieTarget - proteinCalories - fatCalories;
  const carbs = Math.max(0, Math.round(carbCalories / 4));
  const fiber = Math.round((calorieTarget / 1000) * 14);

  return { protein, carbs, fat, fiber };
}

export function calculateWaterTarget(weightKg: number): number {
  return Math.round(weightKg * 35);
}

export function calculateStepTarget(activityLevel: ActivityLevel): number {
  const targets: Record<ActivityLevel, number> = {
    sedentary: 5000,
    light: 7500,
    moderate: 10000,
    very_active: 12500,
    athlete: 15000,
  };
  return targets[activityLevel] ?? 10000;
}

export function computeNutrition(
  per100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  quantity: number,
  unit: string
): { calories: number; protein: number; carbs: number; fat: number; fiber: number } {
  let grams = quantity;
  switch (unit) {
    case 'kg':
      grams = quantity * 1000;
      break;
    case 'L':
      grams = quantity * 1000;
      break;
    case 'piece':
      grams = quantity * 100;
      break;
    case 'cup':
      grams = quantity * 240;
      break;
    case 'tbsp':
      grams = quantity * 15;
      break;
    case 'tsp':
      grams = quantity * 5;
      break;
    default:
      grams = quantity;
  }

  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
    fiber: Math.round(per100g.fiber * factor * 10) / 10,
  };
}

export function sumNutrition(
  items: Array<{ calories: number; protein: number; carbs: number; fat: number; fiber: number }>
): { calories: number; protein: number; carbs: number; fat: number; fiber: number } {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Math.round((acc.protein + item.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
      fat: Math.round((acc.fat + item.fat) * 10) / 10,
      fiber: Math.round((acc.fiber + item.fiber) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  const sleep = new Date(sleepTime).getTime();
  const wake = new Date(wakeTime).getTime();
  if (isNaN(sleep) || isNaN(wake) || wake <= sleep) return 0;
  return Math.round(((wake - sleep) / (1000 * 60 * 60)) * 10) / 10;
}

export function calculateTargets(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: ActivityLevel;
  goal: GoalType;
}) {
  const bmr = calculateBMR(params.weightKg, params.heightCm, params.age, params.gender);
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const calorieTarget = calculateCalorieTarget(tdee, params.goal);
  const macros = calculateMacroTargets(calorieTarget, params.weightKg, params.goal);
  const waterTarget = calculateWaterTarget(params.weightKg);
  const stepTarget = calculateStepTarget(params.activityLevel);

  return {
    bmr,
    tdee,
    calorie_target: calorieTarget,
    protein_target: macros.protein,
    carb_target: macros.carbs,
    fat_target: macros.fat,
    fiber_target: macros.fiber,
    water_target_ml: waterTarget,
    step_target: stepTarget,
    sleep_target_hours: 8,
  };
}
