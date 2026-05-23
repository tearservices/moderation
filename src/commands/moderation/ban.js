const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator, canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0–7)').setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission').setDescription('You need moderator permissions.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const delDays = interaction.options.getInteger('delete_days') ?? 0;

    if (!target) {
      // User not in server – ban by ID
      try {
        await interaction.guild.bans.create(user.id, { reason: `${interaction.user.tag}: ${reason}`, deleteMessageDays: delDays });
        const caseId = await logModAction(interaction.guild, 'BAN', user, interaction.user, reason);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🔨 User Banned').addFields({ name: 'User', value: `${user.tag} (${user.id})`, inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }).setTimestamp()] });
      } catch {
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Ban Failed').setDescription('Cannot ban that user.')], ephemeral: true });
      }
    }

    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Hierarchy Error').setDescription('You cannot moderate this user.')], ephemeral: true });
    if (!target.bannable) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Cannot Ban').setDescription('I cannot ban this user — check my role position.')], ephemeral: true });

    await target.send({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle(`You have been banned from **${interaction.guild.name}**`).addFields({ name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag }).setTimestamp()] }).catch(() => {});
    await target.ban({ reason: `${interaction.user.tag}: ${reason}`, deleteMessageDays: delDays });

    const caseId = await logModAction(interaction.guild, 'BAN', user, interaction.user, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🔨 Member Banned').addFields({ name: 'User', value: `${user.tag}`, inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }, { name: 'Messages Deleted', value: `${delDays}d`, inline: true }).setTimestamp()] });
  },
};
