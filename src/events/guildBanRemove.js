const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getGuildConfig } = require('../utils/database');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban, client) {
    const { guild, user } = ban;
    const config = getGuildConfig(guild.id);
    if (!config.mod_log_channel) return;
    const channel = guild.channels.cache.get(config.mod_log_channel);
    if (!channel) return;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
      const entry = logs.entries.first();
      if (!entry || entry.target?.id !== user.id) return;

      const executor = entry.executor;
      if (executor.id === client.user.id) return; // Already logged by /unban

      await channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ User Unbanned (External)')
          .addFields(
            { name: 'User', value: `<@${user.id}> \`${user.tag}\``, inline: true },
            { name: 'Moderator', value: `<@${executor.id}> \`${executor.tag}\``, inline: true },
            { name: 'Reason', value: entry.reason || 'No reason provided' },
          )
          .setFooter({ text: `User ID: ${user.id}` })
          .setTimestamp()],
      }).catch(() => {});
    } catch {}
  },
};
