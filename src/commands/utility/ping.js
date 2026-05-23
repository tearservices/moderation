const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API response time'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    return interaction.editReply({
      content: null,
      embeds: [new EmbedBuilder()
        .setColor(wsPing < 100 ? 0x57F287 : wsPing < 200 ? 0xFEE75C : 0xED4245)
        .setTitle('🏓 Pong!')
        .addFields(
          { name: 'Roundtrip', value: `\`${roundtrip}ms\``, inline: true },
          { name: 'WebSocket', value: `\`${wsPing}ms\``, inline: true },
        )
        .setTimestamp()],
    });
  },
};
