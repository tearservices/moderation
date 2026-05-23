const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../../utils/database');
const firefli = require('../../utils/firefli');

function requireWorkspace(interaction) {
  const cfg = getGuildConfig(interaction.guild.id);
  if (!cfg.firefli_enabled || !cfg.firefli_workspace_id) {
    interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌ Firefli Not Configured')
        .setDescription('Set a workspace ID with `/config set firefli_workspace_id <id>` and enable it with `/config toggle firefli_enabled`.')],
      ephemeral: true,
    });
    return null;
  }
  return cfg.firefli_workspace_id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('firefli')
    .setDescription('Firefli Roblox group management integration')
    .addSubcommand(s => s.setName('workspace').setDescription('View workspace information'))
    .addSubcommand(s => s.setName('leaderboard').setDescription('View activity leaderboard'))
    .addSubcommand(s => s.setName('members').setDescription('List workspace members'))
    .addSubcommand(s => s.setName('activity')
      .setDescription('View activity for a specific user')
      .addStringOption(o => o.setName('roblox_id').setDescription('Roblox user ID').setRequired(true)))
    .addSubcommand(s => s.setName('sessions').setDescription('View upcoming session calendar'))
    .addSubcommand(s => s.setName('notices').setDescription('View workspace notices'))
    .addSubcommand(s => s.setName('modcases').setDescription('View Firefli moderation cases'))
    .addSubcommand(s => s.setName('userbook')
      .setDescription('View userbook entries for a Roblox user')
      .addStringOption(o => o.setName('roblox_id').setDescription('Roblox user ID').setRequired(true)))
    .addSubcommand(s => s.setName('allies').setDescription('View workspace allies'))
    .addSubcommand(s => s.setName('live').setDescription('View live moderation events'))
    .addSubcommand(s => s.setName('recommendations').setDescription('View workspace recommendations')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const wsId = requireWorkspace(interaction);
    if (!wsId) return;

    await interaction.deferReply();

    try {
      switch (sub) {

        case 'workspace': {
          const data = await firefli.workspace.info(wsId);
          const embed = new EmbedBuilder()
            .setColor(0x6366F1)
            .setTitle(`🔥 ${data.name || 'Workspace'}`)
            .setDescription(data.description || 'No description.')
            .addFields(
              { name: 'ID', value: String(data.id || wsId), inline: true },
              { name: 'Group ID', value: String(data.groupId || 'N/A'), inline: true },
              { name: 'Members', value: String(data.memberCount ?? 'N/A'), inline: true },
            )
            .setTimestamp();
          if (data.iconUrl) embed.setThumbnail(data.iconUrl);
          return interaction.editReply({ embeds: [embed] });
        }

        case 'leaderboard': {
          const data = await firefli.workspace.leaderboard(wsId);
          const entries = Array.isArray(data) ? data : (data.leaderboard || data.entries || []);
          const lines = entries.slice(0, 20).map((e, i) =>
            `**${i + 1}.** ${e.username || e.name || e.userId} — \`${e.minutes ?? e.time ?? e.points ?? e.value ?? '?'}\` mins`
          ).join('\n') || 'No entries found.';
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Activity Leaderboard').setDescription(lines).setTimestamp()] });
        }

        case 'members': {
          const data = await firefli.workspace.members(wsId);
          const members = Array.isArray(data) ? data : (data.members || []);
          const lines = members.slice(0, 25).map(m =>
            `**${m.username || m.name || m.userId}** — ${m.rank || m.role || 'Member'}`
          ).join('\n') || 'No members found.';
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle(`🔥 Members (${members.length})`).setDescription(lines).setTimestamp()] });
        }

        case 'activity': {
          const robloxId = interaction.options.getString('roblox_id');
          const data = await firefli.workspace.userActivity(wsId, robloxId);
          const embed = new EmbedBuilder()
            .setColor(0x6366F1)
            .setTitle(`🔥 Activity — User ${robloxId}`)
            .addFields(
              { name: 'Total Minutes', value: String(data.totalMinutes ?? data.minutes ?? 'N/A'), inline: true },
              { name: 'Sessions', value: String(data.sessions ?? data.sessionCount ?? 'N/A'), inline: true },
              { name: 'Last Seen', value: data.lastSeen ? `<t:${Math.floor(new Date(data.lastSeen).getTime() / 1000)}:R>` : 'N/A', inline: true },
            )
            .setTimestamp();
          return interaction.editReply({ embeds: [embed] });
        }

        case 'sessions': {
          const data = await firefli.sessions.calendar(wsId);
          const sessions = Array.isArray(data) ? data : (data.sessions || data.calendar || []);
          if (!sessions.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Sessions').setDescription('No upcoming sessions.')] });
          const lines = sessions.slice(0, 10).map(s => {
            const ts = s.scheduledFor || s.startTime || s.date;
            const time = ts ? `<t:${Math.floor(new Date(ts).getTime() / 1000)}:F>` : 'TBD';
            return `**${s.name || s.title || 'Session'}** — ${time}\n> Host: ${s.host || s.hostName || 'N/A'}`;
          }).join('\n\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Upcoming Sessions').setDescription(lines).setTimestamp()] });
        }

        case 'notices': {
          const data = await firefli.notices.list(wsId);
          const notices = Array.isArray(data) ? data : (data.notices || []);
          if (!notices.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Notices').setDescription('No notices found.')] });
          const lines = notices.slice(0, 10).map(n =>
            `**${n.title || 'Notice'}** — <t:${Math.floor(new Date(n.createdAt || n.date).getTime() / 1000)}:d>\n> ${(n.content || n.description || 'N/A').slice(0, 100)}`
          ).join('\n\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Notices').setDescription(lines).setTimestamp()] });
        }

        case 'modcases': {
          const data = await firefli.moderation.cases(wsId);
          const cases = Array.isArray(data) ? data : (data.cases || []);
          if (!cases.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Moderation Cases').setDescription('No moderation cases found.')] });
          const lines = cases.slice(0, 15).map(c =>
            `**#${c.id}** \`${c.action || c.type || 'Action'}\` — ${c.reason || 'No reason'}\n> User: ${c.userId || 'N/A'} · Mod: ${c.moderatorId || c.moderator || 'N/A'}`
          ).join('\n\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle(`🔥 Moderation Cases (${cases.length})`).setDescription(lines).setTimestamp()] });
        }

        case 'userbook': {
          const robloxId = interaction.options.getString('roblox_id');
          const data = await firefli.userbook.entries(wsId);
          const entries = Array.isArray(data) ? data.filter(e => String(e.userId) === robloxId) : [];
          if (!entries.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Userbook').setDescription(`No userbook entries for user \`${robloxId}\`.`)] });
          const lines = entries.slice(0, 10).map(e =>
            `**${e.type || 'Entry'}** — <t:${Math.floor(new Date(e.createdAt || e.date).getTime() / 1000)}:d>\n> ${e.note || e.reason || e.content || 'N/A'}`
          ).join('\n\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle(`🔥 Userbook — ${robloxId}`).setDescription(lines).setTimestamp()] });
        }

        case 'allies': {
          const data = await firefli.workspace.allies(wsId);
          const allies = Array.isArray(data) ? data : (data.allies || []);
          if (!allies.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Allies').setDescription('No allies found.')] });
          const lines = allies.slice(0, 20).map(a => `**${a.name || a.groupName || a.id}** — ID: \`${a.groupId || a.id || 'N/A'}\``).join('\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle(`🔥 Allies (${allies.length})`).setDescription(lines).setTimestamp()] });
        }

        case 'live': {
          const data = await firefli.moderation.live(wsId);
          const events = Array.isArray(data) ? data : (data.events || data.live || []);
          if (!events.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Live Events').setDescription('No live moderation events.')] });
          const lines = events.slice(0, 15).map(e =>
            `\`${e.type || 'Event'}\` — ${e.username || e.userId || 'N/A'} · ${e.action || ''}`
          ).join('\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Live Moderation Events').setDescription(lines).setTimestamp()] });
        }

        case 'recommendations': {
          const data = await firefli.recommendations.list(wsId);
          const recs = Array.isArray(data) ? data : (data.recommendations || []);
          if (!recs.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle('🔥 Recommendations').setDescription('No recommendations found.')] });
          const lines = recs.slice(0, 10).map(r =>
            `**${r.title || 'Recommendation'}** — ${r.status || 'Open'}\n> ${(r.description || r.content || 'N/A').slice(0, 80)}`
          ).join('\n\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x6366F1).setTitle(`🔥 Recommendations (${recs.length})`).setDescription(lines).setTimestamp()] });
        }

        default:
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Unknown subcommand')] });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Firefli API Error').setDescription(`\`\`\`${msg}\`\`\``).setTimestamp()] });
    }
  },
};
