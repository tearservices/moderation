const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Member to untimeout').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Not in Server')], ephemeral: true });
    if (!target.isCommunicationDisabled()) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Not Timed Out').setDescription('That member does not have an active timeout.')], ephemeral: true });

    await target.timeout(null, `${interaction.user.tag}: ${reason}`);
    const caseId = await logModAction(interaction.guild, 'UNTIMEOUT', user, interaction.user, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('🔓 Timeout Removed').addFields({ name: 'User', value: user.tag, inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }).setTimestamp()] });
  },
};
