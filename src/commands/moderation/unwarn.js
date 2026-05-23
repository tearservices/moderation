const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { removeWarning } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a specific warning by its ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('warning_id').setDescription('Warning ID to remove').setMinValue(1).setRequired(true)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const warnId = interaction.options.getInteger('warning_id');
    const removed = removeWarning(interaction.guild.id, warnId);

    if (!removed) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Warning Not Found').setDescription(`Warning \`#${warnId}\` does not exist in this server.`)], ephemeral: true });

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ Warning Removed').setDescription(`Warning \`#${warnId}\` has been removed.`).setTimestamp()] });
  },
};
