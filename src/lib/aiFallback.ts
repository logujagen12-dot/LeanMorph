export interface FoodItemEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
  unit: string;
}

const CALORIE_TABLE: [string, number, number, number, number, number][] = [
  ['chicken', 165, 31, 0, 3.6, 0],
  ['egg', 155, 13, 1.1, 11, 0],
  ['paneer', 296, 18, 4.5, 22, 0],
  ['rice', 130, 2.7, 28, 0.3, 0.4],
  ['roti', 264, 9, 52, 3, 9],
  ['chapati', 264, 9, 52, 3, 9],
  ['dal', 115, 6.8, 15, 3.1, 4.2],
  ['dosa', 168, 3.9, 29, 3.7, 1.4],
  ['idli', 132, 4, 28, 0.5, 1.5],
  ['banana', 89, 1.1, 23, 0.3, 2.6],
  ['apple', 52, 0.3, 14, 0.2, 2.4],
  ['oats', 389, 17, 66, 7, 10.6],
  ['milk', 61, 3.2, 4.8, 3.3, 0],
  ['yogurt', 59, 10, 3.6, 0.4, 0],
  ['curd', 60, 3.5, 4.5, 3.2, 0],
  ['salmon', 206, 22, 0, 12, 0],
  ['fish', 140, 20, 0, 6, 0],
  ['bread', 265, 9, 49, 3.2, 2.7],
  ['toast', 265, 9, 49, 3.2, 2.7],
  ['protein', 390, 80, 6, 4, 1],
  ['shake', 200, 25, 15, 3, 1],
  ['biryani', 200, 8, 25, 7, 1.5],
  ['salad', 60, 2, 8, 2, 3],
  ['pasta', 150, 5, 30, 1.5, 1.8],
  ['pizza', 266, 11, 33, 10, 2.3],
  ['burger', 250, 13, 24, 12, 1.5],
  ['almond', 579, 21, 22, 50, 12.5],
  ['peanut', 567, 26, 16, 49, 8.5],
  ['coffee', 20, 1, 2, 0.5, 0],
  ['tea', 15, 0.5, 2, 0.3, 0],
];

export function estimateFood(query: string): FoodItemEstimate[] {
  const lower = query.toLowerCase();
  const items: FoodItemEstimate[] = [];

  for (const [kw, cal100, prot100, carb100, fat100, fib100] of CALORIE_TABLE) {
    if (lower.includes(kw)) {
      let grams = 100;
      if (/(2\s*(cup|bowl|plate)|large|300g)/i.test(lower)) grams = 300;
      else if (/(half|small|50g)/i.test(lower)) grams = 50;
      else if (/(1\s*(cup|bowl|plate)|medium|200g)/i.test(lower)) grams = 200;
      else if (/2\s*(egg|roti|dosa|idli|banana|apple|slice)/i.test(lower)) grams = 100;

      const factor = grams / 100;
      items.push({
        name: query.trim() || kw.charAt(0).toUpperCase() + kw.slice(1),
        calories: Math.round(cal100 * factor),
        protein: Math.round(prot100 * factor * 10) / 10,
        carbs: Math.round(carb100 * factor * 10) / 10,
        fat: Math.round(fat100 * factor * 10) / 10,
        fiber: Math.round(fib100 * factor * 10) / 10,
        quantity: grams,
        unit: 'g',
      });
      break;
    }
  }

  if (items.length === 0) {
    items.push({
      name: query.trim() || 'Estimated Meal',
      calories: 250,
      protein: 12,
      carbs: 30,
      fat: 8,
      fiber: 3,
      quantity: 1,
      unit: 'serving',
    });
  }

  return items;
}

export function buildAIChatResponse(
  message: string,
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  targetCal: number,
  targetProtein: number,
  waterMl: number = 0,
  steps: number = 0
): string {
  const msg = message.toLowerCase();
  const remaining = Math.max(0, targetCal - totals.calories);

  if (msg.includes('calorie') || msg.includes('remaining') || msg.includes('left')) {
    return `You have consumed **${Math.round(totals.calories)} kcal** out of your **${targetCal} kcal** daily target.\n\n✨ You have **${Math.round(remaining)} kcal remaining** for today.`;
  }
  if (msg.includes('protein')) {
    const pct = Math.round((totals.protein / (targetProtein || 150)) * 100);
    return `You've logged **${Math.round(totals.protein)}g of protein** today (${pct}% of your ${targetProtein}g target).\n\n${
      pct < 70
        ? '💡 Recommendation: Consider adding high-protein sources like Greek yogurt, eggs, chicken breast, or whey protein.'
        : '💪 Great job hitting your protein goal today!'
    }`;
  }
  if (msg.includes('macro') || msg.includes('carb') || msg.includes('fat')) {
    return `📊 **Today's Macronutrient Summary:**\n- **Protein:** ${Math.round(totals.protein)}g\n- **Carbs:** ${Math.round(totals.carbs)}g\n- **Fat:** ${Math.round(totals.fat)}g\n- **Fiber:** ${Math.round(totals.fiber)}g`;
  }
  if (msg.includes('water') || msg.includes('hydrat')) {
    return `💧 You've logged **${waterMl} ml** of water today. Staying well-hydrated helps your metabolism and workout recovery!`;
  }
  if (msg.includes('suggest') || msg.includes('eat') || msg.includes('idea') || msg.includes('snack')) {
    if (remaining > 450) {
      return `🥗 **Meal Suggestions (~400-500 kcal):**\n1. Grilled chicken breast with rice and steamed vegetables (~450 kcal, 38g protein)\n2. Paneer salad with mixed greens, olive oil, and cucumbers (~380 kcal, 18g protein)\n3. Oatmeal with protein powder, banana slices, and chia seeds (~420 kcal, 32g protein)`;
    } else {
      return `🍎 **Light Snack Ideas (< 200 kcal):**\n1. Plain Greek yogurt with berries (~120 kcal, 15g protein)\n2. 2 Boiled eggs (~155 kcal, 13g protein)\n3. 1 Apple with a handful of almonds (~160 kcal, 4g protein)`;
    }
  }

  return `I am your LeanMorph AI Coach! 🏋️‍♂️\n\nToday you have logged **${Math.round(totals.calories)} kcal** and **${Math.round(totals.protein)}g protein**.\n\nYou have **${Math.round(remaining)} kcal** remaining. Ask me for meal ideas, macro breakdowns, or health tips!`;
}
