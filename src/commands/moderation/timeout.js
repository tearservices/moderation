const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const { isModerator, canModerate } = require('../../utils/permissions');
const { logModAction, formatDuration } = require('../../utils/modlog');

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // 28 days in ms

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Member to timeout').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 10m, 1h, 1d, 7d (max 28d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for timeout').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const target   = interaction.options.getMember('user');
    const user     = interaction.options.getUser('user');
    const durStr   = interaction.options.getString('duration');
    const reason   = interaction.options.getString('reason') || 'No reason provided';
    const duration = ms(durStr);

    if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Not in Server')], ephemeral: true });
    if (!duration || duration < 5000) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Invalid Duration').setDescription('Use formats like `10m`, `1h`, `1d`. Minimum 5 seconds.')], ephemeral: true });
    if (duration > MAX_TIMEOUT) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Too Long').setDescription('Maximum timeout is 28 days.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Hierarchy Error')], ephemeral: true });
    if (!target.moderatable) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Cannot Timeout')], ephemeral: true });

    await target.send({ embeds: [new EmbedBuilder().setColor(0xEB459E).setTitle(`You have been timed out in **${interaction.guild.name}**`).addFields({ name: 'Duration', value: formatDuration(duration) }, { name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag }).setTimestamp()] }).catch(() => {});
    await target.timeout(duration, `${interaction.user.tag}: ${reason}`);

    const caseId = await logModAction(interaction.guild, 'TIMEOUT', user, interaction.user, reason, duration);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xEB459E).setTitle('⏱️ Member Timed Out').addFields({ name: 'User', value: user.tag, inline: true }, { name: 'Duration', value: formatDuration(duration), inline: true }, { name: 'Reason', value: reason }, { name: 'Case', value: `#${caseId}`, inline: true }).setTimestamp()] });
  },
};
