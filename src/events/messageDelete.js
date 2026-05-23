const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getGuildConfig } = require('../utils/database');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    const config = getGuildConfig(message.guild.id);
    if (!config.log_channel) return;
    const channel = message.guild.channels.cache.get(config.log_channel);
    if (!channel) return;

    // Try to find who deleted via audit log
    let deleter = null;
    try {
      const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && entry.target?.id === message.author?.id && Date.now() - entry.createdTimestamp < 5000) {
        deleter = entry.executor;
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Author', value: message.author ? `<@${message.author.id}> \`${message.author.tag}\`` : 'Unknown', inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
      )
      .setFooter({ text: `Author ID: ${message.author?.id || 'Unknown'}` })
      .setTimestamp();

    if (deleter && deleter.id !== message.author?.id) {
      embed.addFields({ name: 'Deleted By', value: `<@${deleter.id}> \`${deleter.tag}\``, inline: true });
    }

    const content = message.content || message.embeds?.length ? `${message.content || ''}${message.embeds.length ? ` [+${message.embeds.length} embed(s)]` : ''}` : '[No text content]';
    if (content) embed.setDescription(`\`\`\`${content.slice(0, 1000)}\`\`\``);

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
