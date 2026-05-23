const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isModerator } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1–100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Permission')], ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const target = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      // Filter by age (must be < 14 days for bulk delete)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (target) messages = messages.filter(m => m.author.id === target.id);

      messages = [...messages.values()].slice(0, amount);

      if (!messages.length) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ No Messages').setDescription('No deletable messages found (messages older than 14 days cannot be bulk deleted).')] });
      }

      const deleted = await interaction.channel.bulkDelete(messages, true);
      await logModAction(interaction.guild, 'PURGE', interaction.user, interaction.user, `Purged ${deleted.size} messages${target ? ` from ${target.tag}` : ''} in #${interaction.channel.name}`);

      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🗑️ Messages Purged').addFields({ name: 'Deleted', value: `${deleted.size}`, inline: true }, { name: 'Channel', value: `${interaction.channel}`, inline: true }, { name: 'Filter', value: target ? target.tag : 'All users', inline: true }).setTimestamp()] });
    } catch (err) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Purge Failed').setDescription(err.message)] });
    }
  },
};
