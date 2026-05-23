require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');
const { initDatabase } = require('./src/utils/database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember],
});

client.commands = new Collection();

function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (item.endsWith('.js')) {
      try {
        const cmd = require(fullPath);
        if (cmd.data && cmd.execute) {
          client.commands.set(cmd.data.name, cmd);
          logger.info(`Loaded command: ${cmd.data.name}`);
        }
      } catch (err) {
        logger.error(`Failed to load ${fullPath}: ${err.message}`);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'src/commands'));

const eventsPath = path.join(__dirname, 'src/events');
if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    try {
      const event = require(path.join(eventsPath, file));
      const handler = (...args) => event.execute(...args, client);
      event.once ? client.once(event.name, handler) : client.on(event.name, handler);
      logger.info(`Loaded event: ${event.name}`);
    } catch (err) {
      logger.error(`Failed to load event ${file}: ${err.message}`);
    }
  }
}

process.on('unhandledRejection', err => logger.error('Unhandled rejection:', err?.message || err));
process.on('uncaughtException', err => { logger.error('Uncaught exception:', err?.message || err); });

initDatabase();
logger.info('Database initialized');

client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.success('Bot logged in successfully'))
  .catch(err => { logger.error('Login failed:', err.message); process.exit(1); });
