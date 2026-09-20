import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import * as checkCommand from './commands/check.js';

const rest = new REST().setToken(config.discordToken);

async function main() {
  const commands = [checkCommand.data.toJSON()];
  const route = config.discordGuildId
    ? Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId)
    : Routes.applicationCommands(config.discordClientId);

  await rest.put(route, { body: commands });
  console.log(`Slash-Commands registriert (${config.discordGuildId ? 'Guild' : 'Global, kann bis zu 1h dauern'}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
