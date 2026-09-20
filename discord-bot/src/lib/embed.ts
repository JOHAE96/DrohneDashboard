import { EmbedBuilder } from 'discord.js';
import type { ZoneCheckResult } from './dipul.js';

const STATUS_EMOJI: Record<ZoneCheckResult['status'], string> = {
  ok: '✅',
  restricted: '🚫',
  unknown: '❓',
};

const STATUS_TEXT: Record<ZoneCheckResult['status'], string> = {
  ok: 'Keine bekannte Verbots-/Kontrollzone an dieser Position.',
  restricted: 'Position liegt in mindestens einer geprüften Zone.',
  unknown: 'DIPUL-Check fehlgeschlagen, Status unbekannt.',
};

const STATUS_COLOR: Record<ZoneCheckResult['status'], number> = {
  ok: 0x2ecc71,
  restricted: 0xe74c3c,
  unknown: 0x95a5a6,
};

export function buildZoneEmbed(params: {
  lat: number;
  lng: number;
  zoneCheck: ZoneCheckResult;
  sourceUrl?: string;
}): EmbedBuilder {
  const { lat, lng, zoneCheck, sourceUrl } = params;

  // Deep-Link-Format der Live-Seite (Reihenfolge lng,lat, wie bei Google Maps @-Syntax):
  // https://maptool-dipul.dfs.de/geozones/@{lng},{lat}
  const dipulLink = `https://maptool-dipul.dfs.de/geozones/@${lng},${lat}`;
  const links = [`[DIPUL MapTool öffnen](${dipulLink})`];
  if (sourceUrl) links.push(`[Google Maps](${sourceUrl})`);

  const embed = new EmbedBuilder()
    .setTitle(`${STATUS_EMOJI[zoneCheck.status]} DIPUL-Check`)
    .setDescription(STATUS_TEXT[zoneCheck.status])
    .addFields(
      { name: 'Koordinaten', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}` },
      { name: 'Links', value: links.join(' · ') }
    )
    .setColor(STATUS_COLOR[zoneCheck.status])
    .setImage('attachment://dipul-map.png')
    .setFooter({ text: 'Keine Rechtsberatung – Angaben ohne Gewähr, siehe dipul.de' });

  if (zoneCheck.zoneNames.length > 0) {
    embed.spliceFields(1, 0, {
      name: 'Betroffene Zonen',
      value: zoneCheck.zoneNames.map((z) => `• ${z}`).join('\n'),
    });
  }

  return embed;
}
