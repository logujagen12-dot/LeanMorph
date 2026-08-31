import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function calcDuration(bedtime: string | null, waketime: string | null): number | null {
  if (!bedtime || !waketime) return null;
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = waketime.split(":").map(Number);
  if (isNaN(bh) || isNaN(wh)) return null;
  let diff = (wh * 60 + wm) - (bh * 60 + bm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
}

function buildFallback(
  message: string,
  entries: Array<{ food_name: string; quantity: number; unit: string; meal: string; calories: number; protein: number; carbs: number; fat: number }>,
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  profile: { calorie_target?: number; protein_target?: number; carb_target?: number; fat_target?: number; fiber_target?: number; goal?: string; weight_kg?: number; target_weight_kg?: number; name?: string; water_target_ml?: number; step_target?: number; sleep_target_hours?: number },
  sleepHours: number,
  waterTotal: number,
  steps: number,
  workoutMinutes: number,
  workouts: Array<{ name: string; category: string; duration_minutes: number }>
): string {
  const lowerMsg = message.toLowerCase();
  const remaining = Math.max(0, (profile.calorie_target || 2000) - totals.calories);

  if (lowerMsg.includes("eat") || lowerMsg.includes("today") || lowerMsg.includes("logged")) {
    if (entries.length === 0) return "You haven't logged any food yet today. Would you like to add something for breakfast, lunch, or a snack?";
    const byMeal: Record<string, string[]> = {};
    entries.forEach((e) => { (byMeal[e.meal] = byMeal[e.meal] || []).push(`${e.food_name} (${e.quantity}${e.unit})`); });
    const mealBreakdown = Object.entries(byMeal).map(([meal, items]) => `${meal}: ${items.join(", ")}`).join("\n");
    return `Here's what you've eaten today:\n${mealBreakdown}\n\nTotal: ${Math.round(totals.calories)} calories, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${Math.round(totals.fiber)}g fiber. You have ${Math.round(remaining)} calories remaining.`;
  }
  if (lowerMsg.includes("remaining") || lowerMsg.includes("left")) {
    return `You have ${Math.round(remaining)} calories remaining for today (${Math.round(totals.calories)}/${profile.calorie_target || 2000}). You've had ${Math.round(totals.protein)}g protein out of ${profile.protein_target || 150}g target.`;
  }
  if (lowerMsg.includes("protein")) {
    const pct = Math.round((totals.protein / (profile.protein_target || 150)) * 100);
    return `You've had ${Math.round(totals.protein)}g protein today out of ${profile.protein_target || 150}g target (${pct}%). ${pct < 80 ? "Try adding a protein-rich snack like Greek yogurt, eggs, or a protein shake." : "Great job hitting your protein goal!"}`;
  }
  if (lowerMsg.includes("water") || lowerMsg.includes("hydrat")) {
    return `You've drunk ${Math.round(waterTotal)}ml of water today (target: ${profile.water_target_ml || 3000}ml). ${waterTotal < (profile.water_target_ml || 3000) * 0.5 ? "You should drink more water — try a glass now!" : "Good hydration so far!"}`;
  }
  if (lowerMsg.includes("sleep")) {
    return `You logged ${sleepHours}h of sleep last night. ${sleepHours < 6 ? "That's on the lower side — try to get to bed earlier tonight." : sleepHours >= 7 ? "Nice, that's a healthy amount of sleep!" : "Decent sleep. Aim for 7-9 hours for best recovery."}`;
  }
  if (lowerMsg.includes("step") || lowerMsg.includes("walk")) {
    return `You've done ${steps.toLocaleString()} steps today (target: ${(profile.step_target || 10000).toLocaleString()}). ${steps < (profile.step_target || 10000) * 0.5 ? "A short walk could help you reach your step goal." : "Great progress on your step count!"}`;
  }
  if (lowerMsg.includes("workout") || lowerMsg.includes("exercise")) {
    if (workouts.length === 0) return "No workouts logged today. Even a 20-minute walk or bodyweight session counts!";
    const wList = workouts.map((w) => `${w.name} (${w.category}, ${w.duration_minutes}min)`).join(", ");
    return `You've done ${workouts.length} workout(s) today totaling ${workoutMinutes} minutes: ${wList}.`;
  }
  if (lowerMsg.includes("suggest") || lowerMsg.includes("meal") || lowerMsg.includes("eat") || lowerMsg.includes("recommend")) {
    const mealIdeas = remaining > 500
      ? `You have ${Math.round(remaining)} calories left. Try: grilled chicken with rice and vegetables (~500 kcal, 40g protein), or a smoothie bowl with berries and granola (~400 kcal).`
      : "You're close to your calorie target. A light snack like a piece of fruit or a handful of nuts would fit well.";
    return mealIdeas;
  }
  if (lowerMsg.includes("calorie")) {
    return `You've consumed ${Math.round(totals.calories)} calories out of ${profile.calorie_target || 2000} target. That's ${Math.round((totals.calories / (profile.calorie_target || 2000)) * 100)}% of your daily goal.`;
  }
  if (lowerMsg.includes("macro")) {
    return `Today's macros: ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${Math.round(totals.fiber)}g fiber. Targets: ${profile.protein_target || 150}g protein, ${profile.carb_target || 200}g carbs, ${profile.fat_target || 65}g fat.`;
  }
  return `I'm your personal nutrition coach! I can see you've had ${Math.round(totals.calories)} calories, ${Math.round(totals.protein)}g protein, ${Math.round(waterTotal)}ml water, ${steps.toLocaleString()} steps, and ${sleepHours}h sleep today. Ask me about your meals, macros, or for personalized suggestions!`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { message, history } = body;

    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Fetch today's full data
    const [entriesRes, profileRes, sleepRes, waterRes, stepsRes, workoutsRes, weightRes] = await Promise.all([
      supabase.from("food_entries").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("sleep_logs").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
      supabase.from("water_logs").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("step_logs").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
      supabase.from("workouts").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("weight_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(2),
    ]);

    // Fetch 7-day history for trend analysis
    const [histEntriesRes, histSleepRes, histWaterRes, histStepsRes, histWorkoutsRes] = await Promise.all([
      supabase.from("food_entries").select("date,calories,protein,carbs,fat,fiber").eq("user_id", user.id).gte("date", sevenDaysAgo),
      supabase.from("sleep_logs").select("date,duration_hours").eq("user_id", user.id).gte("date", sevenDaysAgo),
      supabase.from("water_logs").select("date,amount_ml").eq("user_id", user.id).gte("date", sevenDaysAgo),
      supabase.from("step_logs").select("date,steps").eq("user_id", user.id).gte("date", sevenDaysAgo),
      supabase.from("workouts").select("date,duration_minutes").eq("user_id", user.id).gte("date", sevenDaysAgo),
    ]);

    const entries = entriesRes.data || [];
    const profile = profileRes || {};
    const sleepHours = sleepRes.data?.duration_hours || calcDuration(sleepRes.data?.sleep_time, sleepRes.data?.wake_time) || 0;
    const waterTotal = (waterRes.data || []).reduce((sum: number, w: { amount_ml: number }) => sum + w.amount_ml, 0);
    const steps = stepsRes.data?.steps || 0;
    const workouts = workoutsRes.data || [];
    const workoutMinutes = workouts.reduce((sum: number, w: { duration_minutes: number }) => sum + w.duration_minutes, 0);

    const totals = entries.reduce((acc: { calories: number; protein: number; carbs: number; fat: number; fiber: number }, e: { calories: number; protein: number; carbs: number; fat: number; fiber: number }) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + e.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Build 7-day trend summary
    const histByDate = new Map<string, { calories: number; protein: number; water: number; steps: number; sleep: number; workouts: number }>();
    (histEntriesRes.data || []).forEach((e: { date: string; calories: number; protein: number }) => {
      if (!histByDate.has(e.date)) histByDate.set(e.date, { calories: 0, protein: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
      const d = histByDate.get(e.date)!;
      d.calories += e.calories; d.protein += e.protein;
    });
    (histWaterRes.data || []).forEach((w: { date: string; amount_ml: number }) => {
      if (!histByDate.has(w.date)) histByDate.set(w.date, { calories: 0, protein: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
      histByDate.get(w.date)!.water += w.amount_ml;
    });
    (histStepsRes.data || []).forEach((s: { date: string; steps: number }) => {
      if (!histByDate.has(s.date)) histByDate.set(s.date, { calories: 0, protein: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
      histByDate.get(s.date)!.steps += s.steps;
    });
    (histSleepRes.data || []).forEach((s: { date: string; duration_hours: number }) => {
      if (!histByDate.has(s.date)) histByDate.set(s.date, { calories: 0, protein: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
      histByDate.get(s.date)!.sleep += s.duration_hours;
    });
    (histWorkoutsRes.data || []).forEach((w: { date: string; duration_minutes: number }) => {
      if (!histByDate.has(w.date)) histByDate.set(w.date, { calories: 0, protein: 0, water: 0, steps: 0, sleep: 0, workouts: 0 });
      histByDate.get(w.date)!.workouts += w.duration_minutes;
    });

    const histDays = Array.from(histByDate.values());
    const avgCalories = histDays.length > 0 ? Math.round(histDays.reduce((s, d) => s + d.calories, 0) / histDays.length) : 0;
    const avgProtein = histDays.length > 0 ? Math.round(histDays.reduce((s, d) => s + d.protein, 0) / histDays.length) : 0;
    const avgWater = histDays.length > 0 ? Math.round(histDays.reduce((s, d) => s + d.water, 0) / histDays.length) : 0;
    const avgSteps = histDays.length > 0 ? Math.round(histDays.reduce((s, d) => s + d.steps, 0) / histDays.length) : 0;
    const avgSleep = histDays.length > 0 ? Math.round(histDays.reduce((s, d) => s + d.sleep, 0) / histDays.length * 10) / 10 : 0;

    const weightCurrent = weightRes.data?.[0]?.weight_kg;
    const weightPrev = weightRes.data?.[1]?.weight_kg;
    const weightChange = (weightCurrent != null && weightPrev != null) ? Math.round((weightCurrent - weightPrev) * 10) / 10 : null;

    // Build meal breakdown
    const byMeal: Record<string, Array<{ name: string; qty: string; cal: number; pro: number }>> = {};
    entries.forEach((e: { food_name: string; quantity: number; unit: string; meal: string; calories: number; protein: number }) => {
      (byMeal[e.meal] = byMeal[e.meal] || []).push({ name: e.food_name, qty: `${e.quantity}${e.unit}`, cal: Math.round(e.calories), pro: Math.round(e.protein) });
    });
    const mealBreakdown = Object.entries(byMeal).map(([meal, items]) =>
      `  ${meal}: ${items.map((i) => `${i.name} (${i.qty}, ${i.cal}kcal, ${i.pro}g protein)`).join("; ")}`
    ).join("\n") || "  (no meals logged)";

    const workoutList = workouts.length > 0
      ? workouts.map((w: { name: string; category: string; duration_minutes: number }) => `${w.name} (${w.category}, ${w.duration_minutes}min)`).join(", ")
      : "none";

    const context = `USER PROFILE
Name: ${profile.name || "User"}
Goal: ${profile.goal || "maintain"}
Weight: ${profile.weight_kg || "unknown"}kg → Target: ${profile.target_weight_kg || "unknown"}kg
${weightChange !== null ? `Recent weight change: ${weightChange > 0 ? "+" : ""}${weightChange}kg` : ""}
Activity level: ${profile.activity_level || "moderate"}

TODAY'S DATA (${today})
Calories: ${Math.round(totals.calories)} / ${profile.calorie_target || 2000} target (${Math.round(Math.max(0, (profile.calorie_target || 2000) - totals.calories))} remaining)
Protein: ${Math.round(totals.protein)}g / ${profile.protein_target || 150}g target
Carbs: ${Math.round(totals.carbs)}g / ${profile.carb_target || 200}g target
Fat: ${Math.round(totals.fat)}g / ${profile.fat_target || 65}g target
Fiber: ${Math.round(totals.fiber)}g / ${profile.fiber_target || 30}g target
Water: ${Math.round(waterTotal)}ml / ${profile.water_target_ml || 3000}ml target
Steps: ${steps.toLocaleString()} / ${(profile.step_target || 10000).toLocaleString()} target
Sleep: ${sleepHours}h last night
Workouts: ${workoutMinutes}min total — ${workoutList}

MEAL BREAKDOWN
${mealBreakdown}

7-DAY AVERAGES
Calories: ${avgCalories}kcal/day
Protein: ${avgProtein}g/day
Water: ${avgWater}ml/day
Steps: ${avgSteps.toLocaleString()}/day
Sleep: ${avgSleep}h/night`;

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      const response = buildFallback(message, entries, totals, profile, sleepHours, waterTotal, steps, workoutMinutes, workouts);
      return new Response(JSON.stringify({ response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      {
        role: "system",
        content: `You are LeanMorph AI, a personal nutrition and fitness coach. You have access to the user's real-time data from their nutrition tracking app.

YOUR CAPABILITIES:
- Answer nutrition and fitness questions naturally and conversationally
- Analyze today's food intake and suggest specific improvements
- Calculate nutrition for foods and portions when asked
- Give personalized meal suggestions based on remaining calories and macros
- Explain calorie and macro information in simple, easy-to-understand terms
- Comment on sleep, hydration, steps, and workout patterns
- Reference the user's 7-day trends to give context-aware advice
- Remember the conversation context from previous messages

YOUR PERSONALITY:
- Encouraging, supportive, and non-judgmental
- Practical and specific — give actionable advice, not generic tips
- Use the user's actual numbers when answering (e.g., "You've had 45g of your 150g protein target")
- Keep responses concise but informative — use short paragraphs or bullet points
- Celebrate wins and gently suggest improvements

RULES:
- Do not provide medical advice. Suggest consulting a doctor for medical concerns.
- If the user asks to add a food, confirm the details before they log it.
- If data is missing (no food logged, no sleep data), acknowledge it and encourage them to start tracking.
- Reference today's date and the user's name when appropriate.

USER DATA:
${context}`,
      },
      ...(history || []).map((h: { role: string; content: string }) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const response = buildFallback(message, entries, totals, profile, sleepHours, waterTotal, steps, workoutMinutes, workouts);
        return new Response(JSON.stringify({ response }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const response = aiData.choices?.[0]?.message?.content || buildFallback(message, entries, totals, profile, sleepHours, waterTotal, steps, workoutMinutes, workouts);

      return new Response(JSON.stringify({ response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      const response = buildFallback(message, entries, totals, profile, sleepHours, waterTotal, steps, workoutMinutes, workouts);
      return new Response(JSON.stringify({ response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
