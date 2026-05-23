const logger = require('../utils/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    logger.success(`Logged in as ${client.user.tag} (${client.user.id})`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s) · ${client.users.cache.size} users`);

    const statuses = [
      { name: `${client.guilds.cache.size} servers`, type: 3 },
      { name: 'the community', type: 0 },
      { name: '/help for commands', type: 2 },
    ];

    let i = 0;
    const rotate = () => {
      const s = statuses[i % statuses.length];
      client.user.setActivity(s.name, { type: s.type });
      i++;
    };
    rotate();
    setInterval(rotate, 60_000);
  },
};
