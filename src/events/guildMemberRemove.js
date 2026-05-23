const { getGuildConfig } = require('../utils/database');
const { logLeave } = require('../utils/modlog');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const guild = member.guild;
    const config = getGuildConfig(guild.id);

    // Leave message
    if (config.leave_channel || config.welcome_channel) {
      const ch = guild.channels.cache.get(config.leave_channel || config.welcome_channel);
      if (ch) {
        const msg = (config.leave_message || '**{tag}** has left the server.')
          .replace('{user}', `${member}`)
          .replace('{tag}', member.user.tag)
          .replace('{server}', guild.name)
          .replace('{count}', guild.memberCount);
        await ch.send({ content: msg }).catch(() => {});
      }
    }

    await logLeave(guild, member);
  },
};
