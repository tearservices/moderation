const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { checkSpam, checkMentionSpam, checkCaps, checkLinks } = require('../utils/antispam');
const { logAutoMod } = require('../utils/modlog');
const logger = require('../utils/logger');

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes for automod violations

async function automodAction(message, reason, actionType, details = '') {
  const member = message.member;
  if (!member || !message.guild) return;

  await message.delete().catch(() => {});
  await logAutoMod(message.guild, actionType, member, reason, details);

  try {
    if (member.moderatable) {
      await member.timeout(TIMEOUT_DURATION, `AutoMod: ${reason}`);
    }
  } catch {}

  const warn = await message.channel.send({
    embeds: [new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle(`🤖 AutoMod — ${actionType.replace('ANTI', 'Anti-')}`)
      .setDescription(`${member} your message was removed.\n**Reason:** ${reason}`)
      .setFooter({ text: 'Continued violations may result in further action' })
      .setTimestamp()],
  }).catch(() => null);

  if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author?.bot) return;
    if (!message.guild) return;
    if (!message.member) return;

    // Skip admins and moderators from automod
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const config = getGuildConfig(message.guild.id);
    if (!config.auto_mod) return;

    // ── Antispam ────────────────────────────────────────────────
    if (config.antispam) {
      const spam = checkSpam(message, config);
      if (spam.triggered) {
        logger.info(`[ANTISPAM] ${message.author.tag} in ${message.guild.name}: ${spam.type} (${spam.count})`);
        await automodAction(
          message,
          spam.type === 'FLOOD' ? `Message flooding (${spam.count} messages)` : `Duplicate messages (${spam.count} times)`,
          'ANTISPAM',
          `Type: ${spam.type}`,
        );
        return;
      }
    }

    // ── Anti-pinging ─────────────────────────────────────────────
    if (config.antipinging) {
      const pingCheck = checkMentionSpam(message, config);
      if (pingCheck.triggered) {
        logger.info(`[ANTIPINGING] ${message.author.tag} in ${message.guild.name}: ${pingCheck.count} mentions`);
        await automodAction(
          message,
          `Mass pinging (${pingCheck.count} mentions)`,
          'ANTIPINGING',
          `Mentions: ${pingCheck.count} / Max: ${config.max_mentions}`,
        );
        return;
      }
    }

    // ── Anti-invite links ─────────────────────────────────────────
    if (config.antilinks) {
      const linkCheck = checkLinks(message);
      if (linkCheck.triggered) {
        logger.info(`[ANTILINKS] ${message.author.tag} in ${message.guild.name}: invite link`);
        await automodAction(message, 'Discord invite link', 'ANTILINKS', 'Invite link detected');
        return;
      }
    }

    // ── Anti-caps ─────────────────────────────────────────────────
    if (config.anticaps) {
      const capsCheck = checkCaps(message, config);
      if (capsCheck.triggered) {
        logger.info(`[ANTICAPS] ${message.author.tag} in ${message.guild.name}: ${capsCheck.percent}% caps`);
        await automodAction(
          message,
          `Excessive caps (${capsCheck.percent}%)`,
          'ANTICAPS',
          `${capsCheck.percent}% uppercase / threshold: ${config.anticaps_threshold}%`,
        );
        return;
      }
    }
  },
};
