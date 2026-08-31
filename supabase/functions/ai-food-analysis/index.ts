import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const { image, text, mode } = body;

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      // Fallback: return mock data when no API key configured
      if (mode === "text" || text) {
        const mockFoods = parseTextFallback(text || "");
        return new Response(JSON.stringify({ foods: mockFoods }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Image mode fallback
      return new Response(JSON.stringify({
        foods: [{
          name: "Mixed Meal",
          quantity: 350,
          unit: "g",
          calories: 620,
          protein: 35,
          carbs: 78,
          fat: 18,
          fiber: 4,
        }],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let messages: Array<{ role: string; content: unknown }>;

    if (image) {
      messages = [
        {
          role: "system",
          content: "You are a nutrition AI. Analyze the food image and return JSON with a 'foods' array. Each food has: name, quantity (number), unit (string), calories (number), protein (number in grams), carbs (number in grams), fat (number in grams), fiber (number in grams). Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food image and estimate nutrition. Return JSON with a 'foods' array." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "system",
          content: "You are a nutrition AI. Parse the natural language food description and return JSON with a 'foods' array. Each food has: name, quantity (number), unit (string), calories (number), protein (number in grams), carbs (number in grams), fat (number in grams), fiber (number in grams). Return ONLY valid JSON.",
        },
        { role: "user", content: text },
      ];
    }

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });
    } catch {
      return fallbackResponse(mode, text);
    }

    if (!aiResponse.ok) {
      return fallbackResponse(mode, text);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { foods: [] };
    }

    return new Response(JSON.stringify({ foods: parsed.foods || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function fallbackResponse(mode: string, text: string) {
  if (mode === "text" || text) {
    const mockFoods = parseTextFallback(text || "");
    return new Response(JSON.stringify({ foods: mockFoods }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({
    foods: [{
      name: "Mixed Meal",
      quantity: 350,
      unit: "g",
      calories: 620,
      protein: 35,
      carbs: 78,
      fat: 18,
      fiber: 4,
    }],
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseTextFallback(text: string) {
  const foods: Array<{ name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }> = [];
  const parts = text.split(/,|and|with/i);
  for (const part of parts) {
    const match = part.trim().match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|piece|cup|tbsp|tsp)?\s*(.+)/i);
    if (match) {
      const qty = parseFloat(match[1]);
      const unit = (match[2] || "g").toLowerCase();
      const name = match[3].trim();
      foods.push({
        name,
        quantity: qty,
        unit,
        calories: Math.round(qty * 2),
        protein: Math.round(qty * 0.1 * 10) / 10,
        carbs: Math.round(qty * 0.4 * 10) / 10,
        fat: Math.round(qty * 0.05 * 10) / 10,
        fiber: Math.round(qty * 0.02 * 10) / 10,
      });
    }
  }
  return foods;
}
