const { EmbedBuilder } = require('discord.js');
const { getGuildConfig, addModCase } = require('./database');

const ACTION_META = {
  BAN:       { color: 0xED4245, emoji: '🔨' },
  UNBAN:     { color: 0x57F287, emoji: '✅' },
  KICK:      { color: 0xFEE75C, emoji: '👢' },
  TIMEOUT:   { color: 0xEB459E, emoji: '⏱️' },
  UNTIMEOUT: { color: 0x57F287, emoji: '🔓' },
  WARN:      { color: 0xFEE75C, emoji: '⚠️' },
  LOCK:      { color: 0xEB459E, emoji: '🔒' },
  UNLOCK:    { color: 0x57F287, emoji: '🔓' },
  PURGE:     { color: 0x5865F2, emoji: '🗑️' },
  ANTISPAM:  { color: 0xFF6B6B, emoji: '🚫' },
  ANTIRAID:  { color: 0xFF0000, emoji: '🛡️' },
  ANTIPINGING: { color: 0xFF6B6B, emoji: '🔔' },
  ANTILINKS: { color: 0xFF6B6B, emoji: '🔗' },
  ANTICAPS:  { color: 0xFEE75C, emoji: '🔤' },
};

function formatDuration(ms) {
  if (!ms) return null;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

async function logModAction(guild, action, target, moderator, reason, duration = null) {
  const caseId = addModCase(guild.id, target.id || target, moderator.id, action, reason, duration);
  const config = getGuildConfig(guild.id);
  if (!config.mod_log_channel) return caseId;

  const channel = guild.channels.cache.get(config.mod_log_channel);
  if (!channel) return caseId;

  const meta = ACTION_META[action] || { color: 0x5865F2, emoji: '📋' };
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${action}  ·  Case #${caseId}`)
    .addFields(
      { name: 'Target', value: `<@${target.id || target}> \`${target.tag || target.username || target}\``, inline: true },
      { name: 'Moderator', value: `<@${moderator.id}> \`${moderator.tag || moderator.username}\``, inline: true },
      { name: 'Reason', value: reason || 'No reason provided' },
    )
    .setFooter({ text: `User ID: ${target.id || target}` })
    .setTimestamp();

  if (duration) embed.addFields({ name: 'Duration', value: formatDuration(duration), inline: true });
  if (target.displayAvatarURL) embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

  await channel.send({ embeds: [embed] }).catch(() => {});
  return caseId;
}

async function logAutoMod(guild, action, member, reason, extra = '') {
  const config = getGuildConfig(guild.id);
  if (!config.mod_log_channel && !config.log_channel) return;
  const channelId = config.mod_log_channel || config.log_channel;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  const meta = ACTION_META[action] || { color: 0xFF6B6B, emoji: '🤖' };
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} AutoMod: ${action}`)
    .addFields(
      { name: 'User', value: `<@${member.id}> \`${member.user?.tag || member.id}\``, inline: true },
      { name: 'Trigger', value: reason, inline: true },
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (extra) embed.addFields({ name: 'Details', value: extra });
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function logGeneral(guild, title, description, color = 0x5865F2, fields = []) {
  const config = getGuildConfig(guild.id);
  if (!config.log_channel) return;
  const channel = guild.channels.cache.get(config.log_channel);
  if (!channel) return;
  const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
  if (fields.length) embed.addFields(fields);
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function logJoin(guild, member) {
  const config = getGuildConfig(guild.id);
  if (!config.join_log_channel) return;
  const channel = guild.channels.cache.get(config.join_log_channel);
  if (!channel) return;
  const age = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('👋 Member Joined')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
      { name: 'Account Age', value: `${age} days`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
    )
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();
  if (age < 7) embed.addFields({ name: '⚠️ New Account', value: `Account is only ${age} day(s) old` });
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function logLeave(guild, member) {
  const config = getGuildConfig(guild.id);
  if (!config.join_log_channel) return;
  const channel = guild.channels.cache.get(config.join_log_channel);
  if (!channel) return;
  const roles = member.roles?.cache.filter(r => r.id !== guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None';
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🚪 Member Left')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
      { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
      { name: 'Roles', value: roles.length > 1024 ? roles.slice(0, 1020) + '...' : roles },
    )
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { logModAction, logAutoMod, logGeneral, logJoin, logLeave, formatDuration };
