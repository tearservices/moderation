const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getGuildConfig } = require('../utils/database');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const { guild, user } = ban;
    const config = getGuildConfig(guild.id);
    if (!config.mod_log_channel) return;
    const channel = guild.channels.cache.get(config.mod_log_channel);
    if (!channel) return;

    // Only log bans not already captured by our /ban command (external bans)
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (!entry || entry.target?.id !== user.id) return;

      const executor = entry.executor;
      if (executor.id === client.user.id) return; // Our own ban, already logged

      await channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🔨 User Banned (External)')
          .addFields(
            { name: 'User', value: `<@${user.id}> \`${user.tag}\``, inline: true },
            { name: 'Moderator', value: `<@${executor.id}> \`${executor.tag}\``, inline: true },
            { name: 'Reason', value: entry.reason || 'No reason provided' },
          )
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: `User ID: ${user.id}` })
          .setTimestamp()],
      }).catch(() => {});
    } catch {}
  },
};
