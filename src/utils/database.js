const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH  = path.join(DATA_DIR, 'db.json');

// ── In-memory store ───────────────────────────────────────────────────────────
let _db = {
  guild_configs: {},
  warnings: [],
  mod_cases: [],
  _warning_seq: 0,
  _case_seq: 0,
};

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try { _db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch {}
  }
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(_db, null, 2), 'utf8');
}

function initDatabase() {
  load();
  // Ensure arrays/maps exist after loading (backward compat)
  _db.guild_configs  = _db.guild_configs  || {};
  _db.warnings       = _db.warnings       || [];
  _db.mod_cases      = _db.mod_cases      || [];
  _db._warning_seq   = _db._warning_seq   || 0;
  _db._case_seq      = _db._case_seq      || 0;
  save();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () => Math.floor(Date.now() / 1000);

const DEFAULTS = {
  log_channel: null, mod_log_channel: null, join_log_channel: null,
  welcome_channel: null, leave_channel: null,
  welcome_message: 'Welcome to {server}, {user}! You are member #{count}.',
  leave_message: '**{tag}** has left the server.',
  mod_role: null,
  auto_mod: 1, antispam: 1, antispam_threshold: 5, antispam_window: 5000,
  antiraid: 1, antiraid_threshold: 10, antiraid_window: 10000,
  antipinging: 1, max_mentions: 5,
  antilinks: 0, anticaps: 0, anticaps_threshold: 70,
  firefli_workspace_id: null, firefli_enabled: 0,
};

// ── Guild config ──────────────────────────────────────────────────────────────
function getGuildConfig(guildId) {
  if (!_db.guild_configs[guildId]) {
    _db.guild_configs[guildId] = { guild_id: guildId, created_at: now(), ...DEFAULTS };
    save();
  }
  // Merge defaults for any missing keys
  const cfg = { ...DEFAULTS, ..._db.guild_configs[guildId] };
  _db.guild_configs[guildId] = cfg;
  return cfg;
}

function setGuildConfig(guildId, key, value) {
  getGuildConfig(guildId);
  _db.guild_configs[guildId][key] = value;
  save();
}

// ── Warnings ──────────────────────────────────────────────────────────────────
function addWarning(guildId, userId, moderatorId, reason) {
  const id = ++_db._warning_seq;
  _db.warnings.push({ id, guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason, created_at: now() });
  save();
  return id;
}

function getWarnings(guildId, userId) {
  return _db.warnings
    .filter(w => w.guild_id === guildId && w.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at);
}

function removeWarning(guildId, warningId) {
  const idx = _db.warnings.findIndex(w => w.guild_id === guildId && w.id === warningId);
  if (idx === -1) return false;
  _db.warnings.splice(idx, 1);
  save();
  return true;
}

function clearWarnings(guildId, userId) {
  _db.warnings = _db.warnings.filter(w => !(w.guild_id === guildId && w.user_id === userId));
  save();
}

// ── Mod cases ─────────────────────────────────────────────────────────────────
function addModCase(guildId, userId, moderatorId, action, reason, duration = null) {
  const id = ++_db._case_seq;
  _db.mod_cases.push({ id, guild_id: guildId, user_id: userId, moderator_id: moderatorId, action, reason, duration, created_at: now() });
  save();
  return id;
}

function getModCases(guildId, userId) {
  return _db.mod_cases
    .filter(c => c.guild_id === guildId && c.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at);
}

module.exports = {
  initDatabase,
  getGuildConfig,
  setGuildConfig,
  addWarning,
  getWarnings,
  removeWarning,
  clearWarnings,
  addModCase,
  getModCases,
};
