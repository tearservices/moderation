const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');
const { addWarning, getWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for warning').setRequired(true)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const target = interaction.options.getMember('user') || interaction.options.getUser('user');
    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (!user) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ User Not Found')], ephemeral: true });

    const warnId = addWarning(interaction.guild.id, user.id, interaction.user.id, reason);
    const total  = getWarnings(interaction.guild.id, user.id).length;

    await logModAction(interaction.guild, 'WARN', user, interaction.user, reason);

    const member = interaction.guild.members.cache.get(user.id);
    if (member) {
      await user.send({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle(`⚠️ Warning in **${interaction.guild.name}**`).addFields({ name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag }, { name: 'Total Warnings', value: `${total}` }).setTimestamp()] }).catch(() => {});
    }

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⚠️ Warning Issued').addFields({ name: 'User', value: `${user.tag}`, inline: true }, { name: 'Warning ID', value: `#${warnId}`, inline: true }, { name: 'Total Warnings', value: `${total}`, inline: true }, { name: 'Reason', value: reason }).setTimestamp()] });
  },
};
