import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { findGoogleMapsUrls, resolveGoogleMapsUrl, parseRawCoordinates, ResolvedLocation } from '../lib/googleMaps.js';
import { getZoneCheckCached } from '../lib/zoneCheck.js';
import { buildZoneMapImage } from '../lib/mapImage.js';
import { buildZoneEmbed } from '../lib/embed.js';

export const data = new SlashCommandBuilder()
  .setName('check')
  .setDescription('Prüft eine Position gegen die DIPUL-Flugverbots-/Kontrollzonen')
  .addStringOption((option) =>
    option
      .setName('ort')
      .setDescription('Google-Maps-Link oder Koordinaten als "lat,lng"')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const input = interaction.options.getString('ort', true);
  await interaction.deferReply({ ephemeral: true });

  let location: ResolvedLocation | null = parseRawCoordinates(input);

  if (!location) {
    const [mapsUrl] = findGoogleMapsUrls(input);
    if (mapsUrl) {
      location = await resolveGoogleMapsUrl(mapsUrl);
    }
  }

  if (!location) {
    await interaction.editReply(
      'Konnte daraus keine Koordinaten lesen. Bitte einen Google-Maps-Link mit Pin oder "lat,lng" angeben.'
    );
    return;
  }

  // Schreibt (falls INTERNAL_API_URL gesetzt) nur in den Zonen-Cache — /check legt bewusst
  // keinen Spot an (siehe docs/architektur-drohnen-spot-bot.md Abschnitt 6.2).
  const zoneCheck = await getZoneCheckCached(location.lat, location.lng);
  const imageBuffer = await buildZoneMapImage(location.lat, location.lng);
  const attachment = new AttachmentBuilder(imageBuffer, { name: 'dipul-map.png' });
  const embed = buildZoneEmbed({ ...location, zoneCheck });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}
