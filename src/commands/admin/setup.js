const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the bot for this server (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o.setName('log_channel').setDescription('Channel for general logs (edits/deletes)').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addChannelOption(o => o.setName('mod_log').setDescription('Channel for moderation action logs').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addChannelOption(o => o.setName('join_log').setDescription('Channel for member join/leave logs').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addChannelOption(o => o.setName('welcome_channel').setDescription('Channel for welcome messages').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addRoleOption(o => o.setName('mod_role').setDescription('Role that grants moderator permissions').setRequired(false))
    .addStringOption(o => o.setName('welcome_message').setDescription('Welcome message. Placeholders: {user} {server} {count} {tag}').setRequired(false))
    .addStringOption(o => o.setName('leave_message').setDescription('Leave message. Placeholders: {user} {server} {count} {tag}').setRequired(false)),

  async execute(interaction) {
    const logCh     = interaction.options.getChannel('log_channel');
    const modLog    = interaction.options.getChannel('mod_log');
    const joinLog   = interaction.options.getChannel('join_log');
    const welcomeCh = interaction.options.getChannel('welcome_channel');
    const modRole   = interaction.options.getRole('mod_role');
    const welcomeMsg = interaction.options.getString('welcome_message');
    const leaveMsg  = interaction.options.getString('leave_message');
    const guildId   = interaction.guild.id;

    const updates = [];

    if (logCh)     { setGuildConfig(guildId, 'log_channel', logCh.id);          updates.push(`📋 Log channel → ${logCh}`); }
    if (modLog)    { setGuildConfig(guildId, 'mod_log_channel', modLog.id);      updates.push(`🔨 Mod log → ${modLog}`); }
    if (joinLog)   { setGuildConfig(guildId, 'join_log_channel', joinLog.id);    updates.push(`👋 Join/leave log → ${joinLog}`); }
    if (welcomeCh) { setGuildConfig(guildId, 'welcome_channel', welcomeCh.id);   updates.push(`🎉 Welcome channel → ${welcomeCh}`); }
    if (modRole)   { setGuildConfig(guildId, 'mod_role', modRole.id);            updates.push(`🛡️ Mod role → ${modRole}`); }
    if (welcomeMsg){ setGuildConfig(guildId, 'welcome_message', welcomeMsg);     updates.push(`💬 Welcome message updated`); }
    if (leaveMsg)  { setGuildConfig(guildId, 'leave_message', leaveMsg);         updates.push(`👋 Leave message updated`); }

    if (updates.length === 0) {
      const cfg = getGuildConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Current Server Configuration')
        .setDescription('Run `/setup` with options to update, or use `/config` for advanced settings.')
        .addFields(
          { name: '📋 Log Channel',     value: cfg.log_channel      ? `<#${cfg.log_channel}>`      : '`Not set`', inline: true },
          { name: '🔨 Mod Log',          value: cfg.mod_log_channel  ? `<#${cfg.mod_log_channel}>`  : '`Not set`', inline: true },
          { name: '👋 Join Log',         value: cfg.join_log_channel ? `<#${cfg.join_log_channel}>` : '`Not set`', inline: true },
          { name: '🎉 Welcome Channel',  value: cfg.welcome_channel  ? `<#${cfg.welcome_channel}>`  : '`Not set`', inline: true },
          { name: '🛡️ Mod Role',         value: cfg.mod_role         ? `<@&${cfg.mod_role}>`        : '`Not set`', inline: true },
          { name: '🚫 Antispam',         value: cfg.antispam    ? '✅ On' : '❌ Off', inline: true },
          { name: '🛡️ Antiraid',         value: cfg.antiraid    ? '✅ On' : '❌ Off', inline: true },
          { name: '🔔 Anti-ping',        value: cfg.antipinging ? '✅ On' : '❌ Off', inline: true },
          { name: '🔗 Anti-links',       value: cfg.antilinks   ? '✅ On' : '❌ Off', inline: true },
          { name: '🔤 Anti-caps',        value: cfg.anticaps    ? '✅ On' : '❌ Off', inline: true },
          { name: '🔥 Firefli',          value: cfg.firefli_enabled ? `✅ Workspace: \`${cfg.firefli_workspace_id}\`` : '❌ Disabled', inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Setup Updated')
        .setDescription(updates.join('\n'))
        .setFooter({ text: 'Use /config to toggle features and set thresholds' })
        .setTimestamp()],
      ephemeral: true,
    });
  },
};
