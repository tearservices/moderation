require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (item.endsWith('.js')) {
      try {
        const cmd = require(fullPath);
        if (cmd.data) {
          commands.push(cmd.data.toJSON());
          console.log(`  Registered: /${cmd.data.name}`);
        }
      } catch (err) {
        console.error(`  Failed: ${fullPath} — ${err.message}`);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'src/commands'));

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\nDeploying ${commands.length} slash commands to guild ${process.env.GUILD_ID}...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`\nSuccessfully deployed ${data.length} commands.\n`);
  } catch (err) {
    console.error('Deployment failed:', err.message);
    process.exit(1);
  }
})();
