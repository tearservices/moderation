const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COMMANDS = {
  '⚙️ Admin': [
    '`/setup` — Configure log channels, mod role, welcome messages',
    '`/config view` — View all settings',
    '`/config toggle <feature>` — Enable/disable antispam, antiraid, etc.',
    '`/config set <setting> <value>` — Set thresholds and values',
  ],
  '🔨 Moderation': [
    '`/ban <user> [reason] [delete_days]` — Ban a user',
    '`/unban <user_id> [reason]` — Unban a user',
    '`/kick <user> [reason]` — Kick a member',
    '`/timeout <user> <duration> [reason]` — Timeout a member',
    '`/untimeout <user>` — Remove a timeout',
    '`/warn <user> <reason>` — Issue a warning',
    '`/unwarn <warning_id>` — Remove a warning',
    '`/warnings <user>` — View all warnings',
    '`/modlogs <user>` — Full moderation history',
    '`/purge <amount> [user]` — Bulk delete messages',
    '`/lock [channel] [reason]` — Lock a channel',
    '`/unlock [channel]` — Unlock a channel',
    '`/slowmode <seconds> [channel]` — Set slowmode',
  ],
  '🔥 Firefli': [
    '`/firefli workspace` — Workspace info',
    '`/firefli leaderboard` — Activity leaderboard',
    '`/firefli members` — List members',
    '`/firefli activity <roblox_id>` — User activity',
    '`/firefli sessions` — Upcoming sessions',
    '`/firefli notices` — Workspace notices',
    '`/firefli modcases` — Moderation cases',
    '`/firefli userbook <roblox_id>` — Userbook entries',
    '`/firefli allies` — Allied groups',
    '`/firefli live` — Live mod events',
    '`/firefli recommendations` — Recommendations',
  ],
  'ℹ️ Utility': [
    '`/ping` — Bot latency',
    '`/serverinfo` — Server information',
    '`/userinfo [user]` — User information',
    '`/avatar [user]` — User avatar',
    '`/help` — This help menu',
  ],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all bot commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📖 Command Reference')
      .setDescription('All commands use slash (/) syntax.\nAdmin commands require the **Administrator** permission.\nModeration commands require the configured **Mod Role** or relevant Discord permissions.')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `${interaction.guild.name} · Community Bot` });

    for (const [category, cmds] of Object.entries(COMMANDS)) {
      embed.addFields({ name: category, value: cmds.join('\n') });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
