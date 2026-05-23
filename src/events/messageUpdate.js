const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/database');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const config = getGuildConfig(newMessage.guild.id);
    if (!config.log_channel) return;
    const channel = newMessage.guild.channels.cache.get(config.log_channel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('✏️ Message Edited')
      .setURL(newMessage.url)
      .addFields(
        { name: 'Author', value: `<@${newMessage.author.id}> \`${newMessage.author.tag}\``, inline: true },
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: 'Before', value: `\`\`\`${(oldMessage.content || '[empty]').slice(0, 500)}\`\`\`` },
        { name: 'After',  value: `\`\`\`${(newMessage.content || '[empty]').slice(0, 500)}\`\`\`` },
      )
      .setFooter({ text: `Message ID: ${newMessage.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
