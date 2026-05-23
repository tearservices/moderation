const joinTracker = new Map();
const raidMode = new Map();

function checkRaid(member, config) {
  const guildId = member.guild.id;
  const now = Date.now();
  const threshold = config.antiraid_threshold || 10;
  const window = config.antiraid_window || 10000;

  if (!joinTracker.has(guildId)) joinTracker.set(guildId, []);
  const joins = joinTracker.get(guildId).filter(t => now - t < window);
  joins.push(now);
  joinTracker.set(guildId, joins);

  if (joins.length >= threshold) {
    joinTracker.set(guildId, []);
    return { triggered: true, count: joins.length };
  }

  return { triggered: false };
}

function setRaidMode(guildId, active) {
  raidMode.set(guildId, active);
}

function isRaidMode(guildId) {
  return raidMode.get(guildId) || false;
}

module.exports = { checkRaid, setRaidMode, isRaidMode };
