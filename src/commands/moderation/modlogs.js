const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { getModCases, getWarnings } = require('../../utils/database');
const { formatDuration } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View moderation history for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const user  = interaction.options.getUser('user');
    const cases = getModCases(interaction.guild.id, user.id);
    const warns = getWarnings(interaction.guild.id, user.id);

    if (!cases.length && !warns.length) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('📋 No Records').setDescription(`${user.tag} has a clean moderation record.`).setTimestamp()], ephemeral: true });
    }

    const caseLines = cases.slice(0, 15).map(c => {
      const dur = c.duration ? ` · ${formatDuration(c.duration)}` : '';
      return `**[#${c.id}]** \`${c.action}\`${dur} — <t:${c.created_at}:d>\n> ${c.reason || 'No reason'} · <@${c.moderator_id}>`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(`📋 Mod Logs — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Cases', value: `${cases.length}`, inline: true },
        { name: 'Warnings', value: `${warns.length}`, inline: true },
        { name: 'User ID', value: user.id, inline: true },
      )
      .setTimestamp();

    if (caseLines) embed.setDescription(caseLines);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
