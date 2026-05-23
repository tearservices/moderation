const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator, canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for kick').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ User Not Found').setDescription('That user is not in this server.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Hierarchy Error').setDescription('You cannot moderate this user.')], ephemeral: true });
    if (!target.kickable) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Cannot Kick').setDescription('I cannot kick this user.')], ephemeral: true });

    await target.send({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle(`You have been kicked from **${interaction.guild.name}**`).addFields({ name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag }).setTimestamp()] }).catch(() => {});
    await target.kick(`${interaction.user.tag}: ${reason}`);

    const caseId = await logModAction(interaction.guild, 'KICK', user, interaction.user, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('👢 Member Kicked').addFields({ name: 'User', value: user.tag, inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }).setTimestamp()] });
  },
};
