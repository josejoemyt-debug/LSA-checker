// Builds a static dashboard into ./dashboard (no npm packages needed).
const fs = require('fs');
const path = require('path');

const DASH = 'dashboard';
const MAX_RUNS = 40;

const now = new Date();
const id = now.toISOString().replace(/[:.]/g, '-');
const runUrl = process.env.RUN_URL || '';

const slug = (name) => name.replace(/\s+/g, '-').toLowerCase();
const stripAnsi = (s) => String(s || '').replace(/\u001b\[[0-9;]*m/g, '');

// ---- 1. Read Playwright's JSON results ----
const specs = [];
function walk(suite) {
  (suite.specs || []).forEach((s) => specs.push(s));
  (suite.suites || []).forEach(walk);
}
try {
  const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
  (results.suites || []).forEach(walk);
} catch (e) {
  console.log('No results.json found; recording this run as an error.');
}

// ---- 2. Copy screenshots into this run's folder ----
const runDir = path.join(DASH, 'runs', id);
fs.mkdirSync(runDir, { recursive: true });

function copyShot(file) {
  const src = path.join('test-results', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(runDir, file));
    return `runs/${id}/${file}`;
  }
  return null;
}

const sites = specs.map((spec) => {
  const name = spec.title.split(' – ')[0];
  const test = (spec.tests || [])[0] || {};
  const result = (test.results || []).slice(-1)[0] || {};
  return {
    name,
    ok: !!spec.ok,
    durationMs: result.duration || 0,
    error: spec.ok ? '' : stripAnsi(result.error && result.error.message).slice(0, 500),
    formView: copyShot(`${slug(name)}-form-view.png`),
    fullPage: copyShot(`${slug(name)}-contact.png`),
  };
});

const status = sites.length === 0 ? 'error' : sites.every((s) => s.ok) ? 'passed' : 'failed';

// ---- 3. Update history (newest first) and prune old runs ----
const historyPath = path.join(DASH, 'history.json');
let history = [];
try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch (e) {}

history.unshift({ id, time: now.toISOString(), status, url: runUrl, sites });
history = history.slice(0, MAX_RUNS);
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

const keep = new Set(history.map((r) => r.id));
const runsRoot = path.join(DASH, 'runs');
for (const d of fs.readdirSync(runsRoot)) {
  if (!keep.has(d)) fs.rmSync(path.join(runsRoot, d), { recursive: true, force: true });
}

// ---- 4. Write the page ----
fs.copyFileSync(path.join(__dirname, 'dashboard-template.html'), path.join(DASH, 'index.html'));
console.log(`Dashboard updated: run ${id} is ${status}`);
