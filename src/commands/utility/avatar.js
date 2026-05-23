const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Display a user's avatar")
    .addUserOption(o => o.setName('user').setDescription('User to get avatar for (defaults to yourself)').setRequired(false)),

  async execute(interaction) {
    const user   = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    const avatar = user.displayAvatarURL({ dynamic: true, size: 4096 });
    const serverAvatar = member?.displayAvatarURL({ dynamic: true, size: 4096 });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🖼️ ${user.tag}'s Avatar`)
      .setImage(avatar)
      .addFields({ name: 'Global Avatar', value: `[PNG](${user.displayAvatarURL({ size: 4096 })}) · [WebP](${avatar})` })
      .setTimestamp();

    if (serverAvatar && serverAvatar !== avatar) {
      embed.addFields({ name: 'Server Avatar', value: `[PNG](${member.displayAvatarURL({ size: 4096 })}) · [WebP](${serverAvatar})` });
      embed.setImage(serverAvatar);
    }

    return interaction.reply({ embeds: [embed] });
  },
};
