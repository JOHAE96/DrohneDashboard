import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Fehlende Umgebungsvariable: ${name}`);
  return value;
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  discordClientId: required('DISCORD_CLIENT_ID'),
  discordGuildId: process.env.DISCORD_GUILD_ID,
  dipulWfsUrl: process.env.DIPUL_WFS_URL ?? 'https://uas-betrieb.de/geoservices/dipul/wfs',
  dipulWmsUrl: process.env.DIPUL_WMS_URL ?? 'https://uas-betrieb.de/geoservices/dipul/wms',
  maxLinksPerMessage: Number(process.env.MAX_LINKS_PER_MESSAGE ?? 3),
};
