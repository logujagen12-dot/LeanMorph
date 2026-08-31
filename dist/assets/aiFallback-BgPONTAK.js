const u=[["chicken",165,31,0,3.6,0],["egg",155,13,1.1,11,0],["paneer",296,18,4.5,22,0],["rice",130,2.7,28,.3,.4],["roti",264,9,52,3,9],["chapati",264,9,52,3,9],["dal",115,6.8,15,3.1,4.2],["dosa",168,3.9,29,3.7,1.4],["idli",132,4,28,.5,1.5],["banana",89,1.1,23,.3,2.6],["apple",52,.3,14,.2,2.4],["oats",389,17,66,7,10.6],["milk",61,3.2,4.8,3.3,0],["yogurt",59,10,3.6,.4,0],["curd",60,3.5,4.5,3.2,0],["salmon",206,22,0,12,0],["fish",140,20,0,6,0],["bread",265,9,49,3.2,2.7],["toast",265,9,49,3.2,2.7],["protein",390,80,6,4,1],["shake",200,25,15,3,1],["biryani",200,8,25,7,1.5],["salad",60,2,8,2,3],["pasta",150,5,30,1.5,1.8],["pizza",266,11,33,10,2.3],["burger",250,13,24,12,1.5],["almond",579,21,22,50,12.5],["peanut",567,26,16,49,8.5],["coffee",20,1,2,.5,0],["tea",15,.5,2,.3,0]];function g(t){const e=t.toLowerCase(),r=[];for(const[i,l,d,a,o,c]of u)if(e.includes(i)){let n=100;/(2\s*(cup|bowl|plate)|large|300g)/i.test(e)?n=300:/(half|small|50g)/i.test(e)?n=50:/(1\s*(cup|bowl|plate)|medium|200g)/i.test(e)?n=200:/2\s*(egg|roti|dosa|idli|banana|apple|slice)/i.test(e)&&(n=100);const s=n/100;r.push({name:t.trim()||i.charAt(0).toUpperCase()+i.slice(1),calories:Math.round(l*s),protein:Math.round(d*s*10)/10,carbs:Math.round(a*s*10)/10,fat:Math.round(o*s*10)/10,fiber:Math.round(c*s*10)/10,quantity:n,unit:"g"});break}return r.length===0&&r.push({name:t.trim()||"Estimated Meal",calories:250,protein:12,carbs:30,fat:8,fiber:3,quantity:1,unit:"serving"}),r}function h(t,e,r,i,l=0,d=0){const a=t.toLowerCase(),o=Math.max(0,r-e.calories);if(a.includes("calorie")||a.includes("remaining")||a.includes("left"))return`You have consumed **${Math.round(e.calories)} kcal** out of your **${r} kcal** daily target.

✨ You have **${Math.round(o)} kcal remaining** for today.`;if(a.includes("protein")){const c=Math.round(e.protein/(i||150)*100);return`You've logged **${Math.round(e.protein)}g of protein** today (${c}% of your ${i}g target).

${c<70?"💡 Recommendation: Consider adding high-protein sources like Greek yogurt, eggs, chicken breast, or whey protein.":"💪 Great job hitting your protein goal today!"}`}return a.includes("macro")||a.includes("carb")||a.includes("fat")?`📊 **Today's Macronutrient Summary:**
- **Protein:** ${Math.round(e.protein)}g
- **Carbs:** ${Math.round(e.carbs)}g
- **Fat:** ${Math.round(e.fat)}g
- **Fiber:** ${Math.round(e.fiber)}g`:a.includes("water")||a.includes("hydrat")?`💧 You've logged **${l} ml** of water today. Staying well-hydrated helps your metabolism and workout recovery!`:a.includes("suggest")||a.includes("eat")||a.includes("idea")||a.includes("snack")?o>450?`🥗 **Meal Suggestions (~400-500 kcal):**
1. Grilled chicken breast with rice and steamed vegetables (~450 kcal, 38g protein)
2. Paneer salad with mixed greens, olive oil, and cucumbers (~380 kcal, 18g protein)
3. Oatmeal with protein powder, banana slices, and chia seeds (~420 kcal, 32g protein)`:`🍎 **Light Snack Ideas (< 200 kcal):**
1. Plain Greek yogurt with berries (~120 kcal, 15g protein)
2. 2 Boiled eggs (~155 kcal, 13g protein)
3. 1 Apple with a handful of almonds (~160 kcal, 4g protein)`:`I am your LeanMorph AI Coach! 🏋️‍♂️

Today you have logged **${Math.round(e.calories)} kcal** and **${Math.round(e.protein)}g protein**.

You have **${Math.round(o)} kcal** remaining. Ask me for meal ideas, macro breakdowns, or health tips!`}export{h as buildAIChatResponse,g as estimateFood};
