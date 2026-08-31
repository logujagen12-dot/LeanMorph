// LeanMorph backend server — zero external dependencies (Node core only).
// Serves the app (public/index.html) and a small JSON-file-backed API
// that matches what health-app.html already expects at /api/state.
//
// Run:   node server.js
// Then open:  http://127.0.0.1:3847

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { URL } = require('url');

const DEFAULT_PORT = 3847;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PUBLIC_DIR = fs.existsSync(path.join(DIST_DIR, 'index.html')) ? DIST_DIR : path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

// ---------- tiny JSON "database" ----------

const EMPTY_STORE = {
  profile: {},
  targets: {},
  goals: [],
  reminders: [],
  weightLog: [],
  history: {},
  days: {}, // days[YYYY-MM-DD] = { water, meals, workouts, sleep, stepsToday }
};

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_STORE, null, 2));
  }
}
ensureDataFile();

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STORE, ...parsed, days: { ...(parsed.days || {}) } };
  } catch (e) {
    return { ...EMPTY_STORE };
  }
}

// Simple write queue so concurrent PUTs can't corrupt the file.
let writeChain = Promise.resolve();
function writeStore(store) {
  writeChain = writeChain.then(() => fsp.writeFile(DATA_FILE, JSON.stringify(store, null, 2)));
  return writeChain;
}

// ---------- tiny static file server ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) filePath = path.join(PUBLIC_DIR, 'index.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA-style fallback: unknown paths get index.html
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(indexContent);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- helpers ----------

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) req.destroy(); // 5MB safety cap
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function withCors(res) {
  // Allows the app to call this API even when opened as a local file://
  // or hosted on a different origin than the API.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ---------- API handlers ----------

function handleGetState(req, res, query) {
  const date = String(query.get('date') || '').trim();
  if (!date) return sendJson(res, 400, { error: 'date query param is required' });

  const store = readStore();
  const day = store.days[date] || {};

  sendJson(res, 200, {
    water: day.water ?? 0,
    meals: Array.isArray(day.meals) ? day.meals : [],
    workouts: Array.isArray(day.workouts) ? day.workouts : [],
    sleep: day.sleep && typeof day.sleep === 'object' ? day.sleep : {},
    stepsToday: day.stepsToday ?? 0,
    profile: store.profile || {},
    targets: store.targets || {},
    goals: Array.isArray(store.goals) ? store.goals : [],
    reminders: Array.isArray(store.reminders) ? store.reminders : [],
    weightLog: Array.isArray(store.weightLog) ? store.weightLog : [],
    history: store.history || {},
  });
}

async function handlePutState(req, res) {
  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }

  const logDate = String(body.logDate || '').trim();
  if (!logDate) return sendJson(res, 400, { error: 'logDate is required' });

  const store = readStore();

  store.days[logDate] = {
    water: body.water ?? 0,
    meals: Array.isArray(body.meals) ? body.meals : [],
    workouts: Array.isArray(body.workouts) ? body.workouts : [],
    sleep: body.sleep && typeof body.sleep === 'object' ? body.sleep : {},
    stepsToday: body.stepsToday ?? 0,
  };

  if (body.profile && typeof body.profile === 'object') store.profile = body.profile;
  if (body.targets && typeof body.targets === 'object') store.targets = body.targets;
  if (body.history && typeof body.history === 'object') store.history = body.history;
  if (Array.isArray(body.goals)) store.goals = body.goals;
  if (Array.isArray(body.reminders)) store.reminders = body.reminders;
  if (Array.isArray(body.weightLog)) store.weightLog = body.weightLog;

  try {
    await writeStore(store);
    sendJson(res, 200, { ok: true, targets: store.targets, weightLog: store.weightLog });
  } catch (e) {
    console.error('Failed to write store:', e);
    sendJson(res, 500, { error: 'failed to save' });
  }
}

function parseAiText(text) {
  const lower = String(text || '').toLowerCase();
  const caloriesByKeyword = [
    ['egg', 78],
    ['banana', 105],
    ['oats', 150],
    ['rice', 205],
    ['chicken', 250],
    ['paneer', 265],
    ['dal', 180],
    ['bread', 80],
    ['yogurt', 120],
    ['salad', 120],
    ['fruit', 90],
    ['smoothie', 220],
    ['pasta', 220],
    ['coffee', 25],
    ['tea', 5],
    ['apple', 95],
    ['protein shake', 200],
    ['toast', 120],
    ['idli', 140],
    ['dosa', 180],
    ['paratha', 220],
    ['biryani', 450],
    ['curry', 320],
  ];

  const match = caloriesByKeyword.find(([word]) => lower.includes(word));
  const base = match ? match[1] : 180;
  const portions = /(1\s*(cup|bowl|plate)|2\s*(cups|bowls|plates)|half|full|small|medium|large|100g|200g|300g)/i;
  const multiplier = portions.test(text) ? (/(2\s*(cups|bowls|plates)|large|300g)/i.test(text) ? 1.8 : /(half|small)/i.test(text) ? 0.7 : 1.2) : 1;
  const calories = Math.max(20, Math.round(base * multiplier));
  const protein = Math.max(3, Math.round(calories * 0.2));
  const carbs = Math.max(5, Math.round(calories * 0.45));
  const fat = Math.max(2, Math.round(calories * 0.25));
  const fiber = Math.max(1, Math.round(calories * 0.08));

  return {
    name: text.trim() || 'Food item',
    cal: calories,
    prot: protein,
    carb: carbs,
    fat: fat,
    fiber: fiber,
  };
}

async function handleAiEstimate(req, res) {
  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }

  const text = String(body.text || '').trim();
  if (!text) return sendJson(res, 400, { error: 'text is required' });

  const meal = String(body.meal || 'Lunch');
  const date = String(body.date || '').trim() || new Date().toISOString().slice(0, 10);

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && typeof fetch === 'function') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition estimator. Return valid JSON with fields: follow_up (string or null), result (object with items array). Each item must include name, cal, prot, carb, fat, fiber. If the request is vague or missing portion details, set follow_up to a short clarifying question and result to {items: []}.',
            },
            {
              role: 'user',
              content: `Estimate nutrition for: ${text}. Meal: ${meal}. Date: ${date}. Keep it simple and practical. Output ONLY JSON.`,
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content || '{}';
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            return sendJson(res, 200, parsed);
          }
        } catch (e) {
          console.warn('OpenAI response was not valid JSON, using local fallback.', e.message);
        }
      }
    } catch (e) {
      console.warn('OpenAI estimation failed, using local fallback.', e.message);
    }
  }

  const fallbackItem = parseAiText(text);
  const generic = /food|meal|eat|lunch|dinner|breakfast|snack|something/i.test(text);
  const followUp = generic && !/(egg|banana|oats|rice|chicken|paneer|dal|bread|yogurt|salad|fruit|smoothie|pasta|dosa|idli|paratha|biryani|curry)/i.test(text)
    ? 'Can you tell me the exact food and portion size (for example: 2 eggs, 1 cup rice, 200g chicken)?'
    : null;

  return sendJson(res, 200, {
    follow_up: followUp,
    result: followUp ? { items: [] } : { items: [fallbackItem] },
  });
}

// ---------- server ----------

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const { pathname } = url;

    if (req.method === 'OPTIONS') {
      withCors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      withCors(res);
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/state' && req.method === 'GET') {
      withCors(res);
      return handleGetState(req, res, url.searchParams);
    }

    if (pathname === '/api/state' && req.method === 'PUT') {
      withCors(res);
      return handlePutState(req, res);
    }

    if (pathname === '/api/ai/estimate' && req.method === 'POST') {
      withCors(res);
      return handleAiEstimate(req, res);
    }

    if (pathname.startsWith('/api/')) {
      withCors(res);
      return sendJson(res, 404, { error: 'not found' });
    }

    serveStatic(req, res, pathname);
  });
}

function startServer(port) {
  const server = createServer();
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      if (nextPort <= port + 10) {
        console.warn(`Port ${port} is busy; retrying on ${nextPort}...`);
        return startServer(nextPort);
      }
      console.error(`No free port found from ${port} to ${port + 10}.`);
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    console.log('LeanMorph server running:');
    console.log(`  App:  http://127.0.0.1:${port}`);
    console.log(`  API:  http://127.0.0.1:${port}/api`);
    console.log(`  Data: ${DATA_FILE}`);
  });
}

startServer(PORT);
