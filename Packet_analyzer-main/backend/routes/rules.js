const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const dpi = require('../services/dpiConnector');

// Rules are stored in a simple JSON file (matches engine's rule persistence)
const RULES_FILE = path.join(__dirname, '..', 'data', 'rules.json');

function loadRules() {
  try {
    if (fs.existsSync(RULES_FILE)) return JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
  } catch {}
  return { blockedIps: [], blockedApps: [], blockedDomains: [], blockedPorts: [] };
}

function saveRules(rules) {
  const dir = path.dirname(RULES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2));
}

// GET /api/rules
router.get('/', (_req, res) => res.json(loadRules()));

// POST /api/rules/block-ip
router.post('/block-ip', (req, res) => {
  const rules = loadRules();
  const { ip } = req.body;
  if (ip && !rules.blockedIps.includes(ip)) rules.blockedIps.push(ip);
  saveRules(rules);
  res.json(rules);
});

// POST /api/rules/block-app
router.post('/block-app', (req, res) => {
  const rules = loadRules();
  const { app } = req.body;
  if (app && !rules.blockedApps.includes(app)) rules.blockedApps.push(app);
  saveRules(rules);
  res.json(rules);
});

// POST /api/rules/block-domain
router.post('/block-domain', (req, res) => {
  const rules = loadRules();
  const { domain } = req.body;
  if (domain && !rules.blockedDomains.includes(domain)) rules.blockedDomains.push(domain);
  saveRules(rules);
  res.json(rules);
});

// DELETE /api/rules/unblock
router.delete('/unblock', (req, res) => {
  const rules = loadRules();
  const { type, value } = req.body;
  if (type === 'ip') rules.blockedIps = rules.blockedIps.filter(v => v !== value);
  if (type === 'app') rules.blockedApps = rules.blockedApps.filter(v => v !== value);
  if (type === 'domain') rules.blockedDomains = rules.blockedDomains.filter(v => v !== value);
  saveRules(rules);
  res.json(rules);
});

module.exports = router;
