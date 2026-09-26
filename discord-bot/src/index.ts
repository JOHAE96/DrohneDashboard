import { Client, GatewayIntentBits, Events, AttachmentBuilder } from 'discord.js';
import { config } from './config.js';
import { findGoogleMapsUrls, resolveGoogleMapsUrl } from './lib/googleMaps.js';
import { getZoneCheckCached } from './lib/zoneCheck.js';
import { createSpot } from './lib/apiClient.js';
import { buildZoneMapImage } from './lib/mapImage.js';
import { buildZoneEmbed } from './lib/embed.js';
import * as checkCommand from './commands/check.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Eingeloggt als ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const urls = findGoogleMapsUrls(message.content);
  if (urls.length === 0) return;

  for (const url of urls.slice(0, config.maxLinksPerMessage)) {
    try {
      const location = await resolveGoogleMapsUrl(url);
      if (!location) continue;

      const zoneCheck = await getZoneCheckCached(location.lat, location.lng);
      const imageBuffer = await buildZoneMapImage(location.lat, location.lng);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'dipul-map.png' });
      const embed = buildZoneEmbed({ ...location, zoneCheck });

      await message.reply({ embeds: [embed], files: [attachment] });

      // Anders als /check: der automatische Link-Scan legt einen echten Spot an (siehe
      // docs/architektur-drohnen-spot-bot.md Abschnitt 6.1) — kein Fehler nach außen, falls
      // die backend-api gerade nicht erreichbar ist (siehe apiClient.ts).
      await createSpot({
        lat: location.lat,
        lng: location.lng,
        originalMapsLink: url,
        suggestedBy: message.author.username,
        discordMessageId: message.id,
        discordMessageLink: message.url,
        zoneStatus: zoneCheck.status,
        zoneNames: zoneCheck.zoneNames,
      });
    } catch (err) {
      console.error('Fehler beim Verarbeiten von', url, err);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'check') return;

  try {
    await checkCommand.execute(interaction);
  } catch (err) {
    console.error('Fehler bei /check', err);
    const payload = { content: 'Es ist ein Fehler aufgetreten.' };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply({ ...payload, ephemeral: true });
    }
  }
});

client.login(config.discordToken);
