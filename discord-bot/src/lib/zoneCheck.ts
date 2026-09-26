import { checkZones, type ZoneCheckResult } from './dipul.js';
import { getCachedZoneCheck, cacheZoneCheck } from './apiClient.js';

// Von /check und der automatischen messageCreate-Erkennung gemeinsam genutzt: erst den
// Cache der backend-api fragen (siehe apiClient.ts), erst bei einem Miss die 30 DIPUL-WFS-
// Layer abfragen. 'unknown' (z.B. Netzwerkfehler) wird nie gecacht.
export async function getZoneCheckCached(lat: number, lng: number): Promise<ZoneCheckResult> {
  const cached = await getCachedZoneCheck(lat, lng);
  if (cached) return cached;

  const result = await checkZones(lat, lng);
  if (result.status !== 'unknown') {
    await cacheZoneCheck(lat, lng, { status: result.status, zoneNames: result.zoneNames });
  }
  return result;
}
