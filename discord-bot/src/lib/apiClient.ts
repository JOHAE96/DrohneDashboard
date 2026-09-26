import { config } from '../config.js';

export interface CachedZoneCheck {
  status: 'ok' | 'restricted';
  zoneNames: string[];
}

export interface CreateSpotInput {
  lat: number;
  lng: number;
  originalMapsLink: string;
  suggestedBy: string;
  discordMessageId: string;
  discordMessageLink: string;
  zoneStatus: 'ok' | 'restricted' | 'unknown';
  zoneNames: string[];
}

// ~1.1m Präzision — nah beieinanderliegende Anfragen (z.B. leicht unterschiedliche Pins am
// selben Spot) treffen so denselben Cache-Eintrag, statt die Cache-Tabelle unnötig zu füllen.
function roundCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function apiUrl(path: string): URL | null {
  if (!config.internalApiUrl) return null;
  return new URL(path, config.internalApiUrl);
}

// Backend-API ist nur intern erreichbar (kein Traefik-Routing) und optional für den Bot —
// jeder Fehler (Netzwerk, Timeout, API down) wird verschluckt statt die eigentliche
// DIPUL-Antwort zu blockieren; Caching/Speichern ist ein Nice-to-have, kein kritischer Pfad.
export async function getCachedZoneCheck(lat: number, lng: number): Promise<CachedZoneCheck | null> {
  const url = apiUrl('/api/zone-cache');
  if (!url) return null;
  url.searchParams.set('lat', String(roundCoord(lat)));
  url.searchParams.set('lng', String(roundCoord(lng)));

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;

    const data = (await res.json()) as { status?: string; zoneNames?: string[] };
    if ((data.status !== 'ok' && data.status !== 'restricted') || !Array.isArray(data.zoneNames)) {
      return null;
    }
    return { status: data.status, zoneNames: data.zoneNames };
  } catch {
    return null;
  }
}

export async function cacheZoneCheck(lat: number, lng: number, result: CachedZoneCheck): Promise<void> {
  const url = apiUrl('/api/zone-cache');
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lat: roundCoord(lat), lng: roundCoord(lng), ...result }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Cache-Schreibfehler sind unkritisch, die Discord-Antwort ist bereits berechnet.
  }
}

export async function createSpot(spot: CreateSpotInput): Promise<void> {
  const url = apiUrl('/api/spots');
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(spot),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Speicherfehler sind unkritisch für v2 — die Discord-Antwort ist bereits verschickt.
  }
}
