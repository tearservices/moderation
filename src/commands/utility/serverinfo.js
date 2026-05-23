const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const VERIFICATION_LEVELS = { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High' };
const BOOST_TIERS = { 0: 'No tier', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about this server'),

  async execute(interaction) {
    const g = interaction.guild;
    await g.members.fetch().catch(() => {});

    const bots    = g.members.cache.filter(m => m.user.bot).size;
    const humans  = g.memberCount - bots;
    const online  = g.members.cache.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;
    const channels = { text: 0, voice: 0, category: 0, other: 0 };
    g.channels.cache.forEach(c => {
      if (c.type === 0) channels.text++;
      else if (c.type === 2) channels.voice++;
      else if (c.type === 4) channels.category++;
      else channels.other++;
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .setImage(g.bannerURL({ size: 1024 }) || null)
      .addFields(
        { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: '🌍 Region', value: g.preferredLocale || 'N/A', inline: true },
        { name: '🔒 Verification', value: VERIFICATION_LEVELS[g.verificationLevel] || 'Unknown', inline: true },
        { name: '👥 Members', value: `${g.memberCount} total · ${humans} human · ${bots} bot\n${online} online`, inline: true },
        { name: '💬 Channels', value: `${channels.text} text · ${channels.voice} voice · ${channels.category} categories`, inline: true },
        { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: '✨ Boosts', value: `${BOOST_TIERS[g.premiumTier]} · ${g.premiumSubscriptionCount} boosts`, inline: true },
        { name: '😀 Emojis', value: `${g.emojis.cache.size}`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:F>`, inline: true },
      )
      .setFooter({ text: `ID: ${g.id}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
