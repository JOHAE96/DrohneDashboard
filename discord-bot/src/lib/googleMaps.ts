const SHORT_LINK_HOSTS = ['maps.app.goo.gl', 'goo.gl'];

const MAPS_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s<>()]+/gi;

export interface ResolvedLocation {
  lat: number;
  lng: number;
  sourceUrl?: string;
}

export function findGoogleMapsUrls(text: string): string[] {
  const matches = text.match(MAPS_URL_REGEX) ?? [];
  return [...new Set(matches)];
}

function isShortLinkHost(host: string): boolean {
  return SHORT_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

async function resolveRedirect(url: string, maxHops = 5): Promise<string> {
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    let host: string;
    try {
      host = new URL(current).host;
    } catch {
      return current;
    }
    if (!isShortLinkHost(host)) return current;

    const res = await fetch(current, { redirect: 'manual' });
    const location = res.headers.get('location');
    if (!location) return current;
    current = new URL(location, current).toString();
  }
  return current;
}

// Reihenfolge nach Präzision: exakter Pin (!3d/!4d) vor Kartenmittelpunkt (@lat,lng),
// da bei Place-Links der Viewport-Mittelpunkt vom eigentlichen Marker abweichen kann.
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const pinMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    return { lat: parseFloat(pinMatch[1]), lng: parseFloat(pinMatch[2]) };
  }

  const queryMatch = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (queryMatch) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  }

  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  return null;
}

export async function resolveGoogleMapsUrl(url: string): Promise<ResolvedLocation | null> {
  const resolvedUrl = await resolveRedirect(url);
  const coords = extractCoordsFromUrl(resolvedUrl);
  if (!coords) return null;
  return { ...coords, sourceUrl: url };
}

export function parseRawCoordinates(text: string): { lat: number; lng: number } | null {
  const match = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
