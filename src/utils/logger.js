const COLORS = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', success: '\x1b[32m' };

function log(level, ...args) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const color = COLORS[level] || '\x1b[37m';
  console.log(`${color}[${ts}] [${level.toUpperCase().padEnd(7)}]\x1b[0m`, ...args);
}

module.exports = {
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
  success: (...a) => log('success', ...a),
};
