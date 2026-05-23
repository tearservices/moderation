const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { getWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const user  = interaction.options.getUser('user');
    const warns = getWarnings(interaction.guild.id, user.id);

    if (!warns.length) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ No Warnings').setDescription(`${user.tag} has no warnings.`).setTimestamp()] });
    }

    const lines = warns.map(w => `**#${w.id}** — <t:${w.created_at}:d> · <@${w.moderator_id}>\n> ${w.reason}`).join('\n\n');

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle(`⚠️ Warnings for ${user.tag}`)
        .setDescription(lines.length > 4000 ? lines.slice(0, 4000) + '...' : lines)
        .setFooter({ text: `${warns.length} total warning(s)` })
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()],
      ephemeral: true,
    });
  },
};
