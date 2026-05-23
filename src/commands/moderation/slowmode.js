const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Slowmode in seconds (0 to disable)').setMinValue(0).setMaxValue(21600).setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to apply slowmode (defaults to current)').addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);
      const msg = seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to **${seconds}s**.`;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('⏱️ Slowmode Updated').addFields({ name: 'Channel', value: `${channel}`, inline: true }, { name: 'Rate', value: seconds === 0 ? 'Disabled' : `${seconds}s`, inline: true }).setDescription(msg).setTimestamp()] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Failed').setDescription(err.message)], ephemeral: true });
    }
  },
};
