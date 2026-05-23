const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel, preventing members from sending messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (defaults to current)').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addStringOption(o => o.setName('reason').setDescription('Reason for lock').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason  = interaction.options.getString('reason') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason: `Lock by ${interaction.user.tag}: ${reason}` });
      await logModAction(interaction.guild, 'LOCK', interaction.user, interaction.user, `${channel.name}: ${reason}`);

      await channel.send({ embeds: [new EmbedBuilder().setColor(0xEB459E).setTitle('🔒 Channel Locked').setDescription(`This channel has been locked by a moderator.\n**Reason:** ${reason}`).setTimestamp()] });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xEB459E).setTitle('🔒 Channel Locked').addFields({ name: 'Channel', value: `${channel}`, inline: true }, { name: 'Reason', value: reason }).setTimestamp()], ephemeral: true });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Lock Failed').setDescription(err.message)], ephemeral: true });
    }
  },
};
