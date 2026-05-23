const userMessages = new Map();
const duplicateTracker = new Map();

const DISCORD_INVITE = /discord(?:\.gg|(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

function checkSpam(message, config) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const threshold = config.antispam_threshold || 5;
  const window = config.antispam_window || 5000;

  if (!userMessages.has(key)) userMessages.set(key, []);
  const timestamps = userMessages.get(key).filter(t => now - t < window);
  timestamps.push(now);
  userMessages.set(key, timestamps);

  if (timestamps.length >= threshold) {
    userMessages.delete(key);
    return { triggered: true, type: 'FLOOD', count: timestamps.length };
  }

  // Duplicate message check
  if (message.content && message.content.length > 5) {
    const dupKey = `${key}:${message.content.trim().toLowerCase()}`;
    if (!duplicateTracker.has(dupKey)) duplicateTracker.set(dupKey, []);
    const dupTimes = duplicateTracker.get(dupKey).filter(t => now - t < 8000);
    dupTimes.push(now);
    duplicateTracker.set(dupKey, dupTimes);

    if (dupTimes.length >= 3) {
      duplicateTracker.delete(dupKey);
      return { triggered: true, type: 'DUPLICATE', count: dupTimes.length };
    }
  }

  // Periodic cleanup
  if (Math.random() < 0.02) {
    for (const [k, v] of userMessages) {
      if (!v.some(t => now - t < window)) userMessages.delete(k);
    }
    for (const [k, v] of duplicateTracker) {
      if (!v.some(t => now - t < 8000)) duplicateTracker.delete(k);
    }
  }

  return { triggered: false };
}

function checkMentionSpam(message, config) {
  const max = config.max_mentions || 5;
  const total = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
  if (total >= max) return { triggered: true, count: total };
  return { triggered: false };
}

function checkCaps(message, config) {
  const text = message.content;
  if (text.length < 12) return { triggered: false };
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 8) return { triggered: false };
  const capsPct = (text.replace(/[^A-Z]/g, '').length / letters.length) * 100;
  if (capsPct >= (config.anticaps_threshold || 70)) return { triggered: true, percent: Math.round(capsPct) };
  return { triggered: false };
}

function checkLinks(message) {
  if (DISCORD_INVITE.test(message.content)) return { triggered: true, type: 'INVITE' };
  return { triggered: false };
}

module.exports = { checkSpam, checkMentionSpam, checkCaps, checkLinks };
