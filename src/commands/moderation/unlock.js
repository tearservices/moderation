const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock (defaults to current)').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unlock').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason  = interaction.options.getString('reason') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }, { reason: `Unlock by ${interaction.user.tag}: ${reason}` });
      await channel.send({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('🔓 Channel Unlocked').setDescription(`This channel has been unlocked.\n**Reason:** ${reason}`).setTimestamp()] });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('🔓 Channel Unlocked').addFields({ name: 'Channel', value: `${channel}`, inline: true }, { name: 'Reason', value: reason }).setTimestamp()], ephemeral: true });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Unlock Failed').setDescription(err.message)], ephemeral: true });
    }
  },
};
