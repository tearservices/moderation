const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or change bot configuration (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s
      .setName('view')
      .setDescription('View all current configuration settings'))
    .addSubcommand(s => s
      .setName('toggle')
      .setDescription('Enable or disable a feature')
      .addStringOption(o => o
        .setName('feature').setDescription('Feature to toggle').setRequired(true)
        .addChoices(
          { name: 'Antispam',            value: 'antispam' },
          { name: 'Antiraid',            value: 'antiraid' },
          { name: 'Anti-pinging',        value: 'antipinging' },
          { name: 'Anti-invite links',   value: 'antilinks' },
          { name: 'Anti-caps',           value: 'anticaps' },
          { name: 'Auto Moderation',     value: 'auto_mod' },
          { name: 'Firefli Integration', value: 'firefli_enabled' },
        )))
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set a configuration value')
      .addStringOption(o => o
        .setName('setting').setDescription('Setting to change').setRequired(true)
        .addChoices(
          { name: 'Antispam – message threshold',     value: 'antispam_threshold' },
          { name: 'Antispam – window (ms)',            value: 'antispam_window' },
          { name: 'Antiraid – join threshold',         value: 'antiraid_threshold' },
          { name: 'Antiraid – window (ms)',            value: 'antiraid_window' },
          { name: 'Anti-ping – max mentions',          value: 'max_mentions' },
          { name: 'Anti-caps – uppercase % threshold', value: 'anticaps_threshold' },
          { name: 'Firefli workspace ID',              value: 'firefli_workspace_id' },
          { name: 'Welcome message',                   value: 'welcome_message' },
          { name: 'Leave message',                     value: 'leave_message' },
        ))
      .addStringOption(o => o.setName('value').setDescription('New value').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'view') {
      const c = getGuildConfig(guildId);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('⚙️ Full Configuration')
          .addFields(
            { name: '**Channels**', value: '​', inline: false },
            { name: 'Log Channel',     value: c.log_channel      ? `<#${c.log_channel}>`      : '`Not set`', inline: true },
            { name: 'Mod Log',         value: c.mod_log_channel  ? `<#${c.mod_log_channel}>`  : '`Not set`', inline: true },
            { name: 'Join Log',        value: c.join_log_channel ? `<#${c.join_log_channel}>` : '`Not set`', inline: true },
            { name: 'Welcome Channel', value: c.welcome_channel  ? `<#${c.welcome_channel}>`  : '`Not set`', inline: true },
            { name: '**Roles**', value: '​', inline: false },
            { name: 'Mod Role',        value: c.mod_role         ? `<@&${c.mod_role}>`        : '`Not set`', inline: true },
            { name: 'Auto Mod',        value: c.auto_mod     ? '✅' : '❌', inline: true },
            { name: '**Anti-Abuse**', value: '​', inline: false },
            { name: 'Antispam',   value: `${c.antispam   ?'✅':'❌'} · ${c.antispam_threshold} msgs / ${c.antispam_window}ms`,    inline: true },
            { name: 'Antiraid',   value: `${c.antiraid   ?'✅':'❌'} · ${c.antiraid_threshold} joins / ${c.antiraid_window}ms`,   inline: true },
            { name: 'Anti-ping',  value: `${c.antipinging?'✅':'❌'} · max ${c.max_mentions} mentions`,                           inline: true },
            { name: 'Anti-links', value: c.antilinks ? '✅' : '❌', inline: true },
            { name: 'Anti-caps',  value: `${c.anticaps   ?'✅':'❌'} · ${c.anticaps_threshold}%`,                                 inline: true },
            { name: '**Firefli**', value: '​', inline: false },
            { name: 'Enabled',     value: c.firefli_enabled ? '✅' : '❌', inline: true },
            { name: 'Workspace ID',value: c.firefli_workspace_id ? `\`${c.firefli_workspace_id}\`` : '`Not set`', inline: true },
          )
          .setTimestamp()],
        ephemeral: true,
      });
    }

    if (sub === 'toggle') {
      const feature = interaction.options.getString('feature');
      const cfg = getGuildConfig(guildId);
      const newVal = cfg[feature] ? 0 : 1;
      setGuildConfig(guildId, feature, newVal);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(newVal ? 0x57F287 : 0xED4245)
          .setTitle('⚙️ Feature Updated')
          .setDescription(`**${feature}** is now ${newVal ? '✅ **enabled**' : '❌ **disabled**'}.`)
          .setTimestamp()],
        ephemeral: true,
      });
    }

    if (sub === 'set') {
      const setting = interaction.options.getString('setting');
      const value   = interaction.options.getString('value');
      const numeric = ['antispam_threshold','antispam_window','antiraid_threshold','antiraid_window','max_mentions','anticaps_threshold'];

      if (numeric.includes(setting)) {
        const n = parseInt(value);
        if (isNaN(n) || n < 1) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Invalid Value').setDescription('Must be a positive number.')], ephemeral: true });
        setGuildConfig(guildId, setting, n);
      } else {
        setGuildConfig(guildId, setting, value);
      }

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Config Updated')
          .setDescription(`**${setting}** → \`${value}\``)
          .setTimestamp()],
        ephemeral: true,
      });
    }
  },
};
