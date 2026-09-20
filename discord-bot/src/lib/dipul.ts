import { config } from '../config.js';

export interface ZoneCheckResult {
  status: 'ok' | 'restricted' | 'unknown';
  zoneNames: string[];
}

// Teilmenge der 30 DIPUL-Layer, die für einen automatisierten Verbots-/Kontrollzonen-Check
// relevant ist (siehe docs/architektur-drohnen-spot-bot.md Abschnitt 7). Die volle Liste
// dient nur der visuellen Kartendarstellung im Dashboard.
const LAYER_LABELS: Record<string, string> = {
  kontrollzonen: 'Kontrollzone (Flughafen)',
  flugbeschraenkungsgebiete: 'Flugbeschränkungsgebiet',
  naturschutzgebiete: 'Naturschutzgebiet',
  nationalparks: 'Nationalpark',
  vogelschutzgebiete: 'Vogelschutzgebiet',
  'ffh-gebiete': 'FFH-Gebiet',
  wohngrundstuecke: 'Wohngrundstück (100m-Zone)',
  temporaere_betriebseinschraenkungen: 'Temporäre Betriebseinschränkung',
};

export const CHECK_LAYERS = Object.keys(LAYER_LABELS);

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkZones(lat: number, lng: number): Promise<ZoneCheckResult> {
  const typeNames = CHECK_LAYERS.map((l) => `dipul:${l}`).join(',');
  const url = new URL(config.dipulWfsUrl);
  url.searchParams.set('service', 'WFS');
  url.searchParams.set('version', '2.0.0');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('typeNames', typeNames);
  url.searchParams.set('outputFormat', 'application/json');
  url.searchParams.set('srsName', 'EPSG:4326');
  // Geometrie-Attribut "geom" ist GeoServer-Standard, aber pro Layer nicht garantiert
  // (siehe offener Punkt in der Architektur) — bei Bedarf per DescribeFeatureType prüfen.
  url.searchParams.set('CQL_FILTER', `INTERSECTS(geom,POINT(${lng} ${lat}))`);

  try {
    const res = await fetchWithTimeout(url.toString(), 8000);
    if (!res.ok) return { status: 'unknown', zoneNames: [] };

    const data = (await res.json()) as { features?: Array<{ id?: string }> };
    const features = data.features ?? [];
    if (features.length === 0) return { status: 'ok', zoneNames: [] };

    const layers = new Set<string>();
    for (const feature of features) {
      const layerKey = feature.id?.split('.')[0]?.replace(/^dipul:/, '');
      if (layerKey) layers.add(LAYER_LABELS[layerKey] ?? layerKey);
    }
    return { status: 'restricted', zoneNames: [...layers] };
  } catch {
    return { status: 'unknown', zoneNames: [] };
  }
}
