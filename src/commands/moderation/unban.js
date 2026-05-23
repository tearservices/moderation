const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unban').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission').setDescription('You need moderator permissions.')], ephemeral: true });

    const userId = interaction.options.getString('user_id').trim();
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!/^\d+$/.test(userId)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Invalid ID').setDescription('Please provide a valid user ID.')], ephemeral: true });

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Not Banned').setDescription('That user is not banned.')], ephemeral: true });

      await interaction.guild.bans.remove(userId, `${interaction.user.tag}: ${reason}`);
      const caseId = await logModAction(interaction.guild, 'UNBAN', ban.user, interaction.user, reason);

      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ User Unbanned').addFields({ name: 'User', value: `${ban.user.tag} (${userId})`, inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }).setTimestamp()] });
    } catch (err) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Unban Failed').setDescription(err.message)], ephemeral: true });
    }
  },
};
