const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display information about a user')
    .addUserOption(o => o.setName('user').setDescription('User to check (defaults to yourself)').setRequired(false)),

  async execute(interaction) {
    const user   = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`)
          .join(' ')
      : 'Not in server';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x5865F2)
      .setTitle(`${user.tag}${user.bot ? ' 🤖' : ''}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setTimestamp();

    if (member) {
      embed.addFields(
        { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '🔝 Top Role', value: `${member.roles.highest}`, inline: true },
        { name: '📛 Nickname', value: member.nickname || 'None', inline: true },
        { name: `🎭 Roles (${member.roles.cache.size - 1})`, value: roles.length > 1024 ? roles.slice(0, 1020) + '...' : (roles || 'None') },
      );

      if (member.premiumSinceTimestamp) {
        embed.addFields({ name: '✨ Boosting Since', value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`, inline: true });
      }
    }

    return interaction.reply({ embeds: [embed] });
  },
};
