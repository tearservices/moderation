const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { checkRaid, setRaidMode, isRaidMode } = require('../utils/antiraid');
const { logJoin, logAutoMod } = require('../utils/modlog');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    const config = getGuildConfig(guild.id);

    // Welcome message
    if (config.welcome_channel) {
      const ch = guild.channels.cache.get(config.welcome_channel);
      if (ch) {
        const msg = (config.welcome_message || 'Welcome to {server}, {user}!')
          .replace('{user}', `${member}`)
          .replace('{tag}', member.user.tag)
          .replace('{server}', guild.name)
          .replace('{count}', guild.memberCount);
        await ch.send({ content: msg }).catch(() => {});
      }
    }

    // Join log
    await logJoin(guild, member);

    // Antiraid check
    if (config.antiraid) {
      const result = checkRaid(member, config);

      if (result.triggered) {
        if (!isRaidMode(guild.id)) {
          setRaidMode(guild.id, true);
          logger.warn(`[ANTIRAID] Raid detected in ${guild.name} — ${result.count} joins in window`);

          // Notify mod log
          await logAutoMod(guild, 'ANTIRAID', member, `Mass join detected`, `${result.count} joins triggered raid mode`);

          // Elevate verification level to high
          const oldLevel = guild.verificationLevel;
          if (oldLevel < 4) {
            await guild.setVerificationLevel(4, 'Antiraid: mass join detected').catch(() => {});
          }

          // Alert in log channel
          const cfg = getGuildConfig(guild.id);
          const alertCh = guild.channels.cache.get(cfg.mod_log_channel || cfg.log_channel);
          if (alertCh) {
            await alertCh.send({
              embeds: [new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 RAID DETECTED — Lockdown Activated')
                .setDescription(`**${result.count}** joins detected in a short window.\nVerification level has been raised to **Very High**.\n\nRun \`/config toggle antiraid\` or manually lower verification when the raid is over.`)
                .setTimestamp()],
            }).catch(() => {});
          }
        }
      }
    }

    // New account warning
    const ageDays = (Date.now() - member.user.createdTimestamp) / 86400000;
    if (config.antiraid && ageDays < 1 && isRaidMode(guild.id)) {
      await member.kick('Antiraid: new account joined during raid mode').catch(() => {});
      logger.info(`[ANTIRAID] Kicked new account ${member.user.tag} during raid mode`);
    }
  },
};
