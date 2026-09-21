import { config } from '../config.js';

export interface ZoneCheckResult {
  status: 'ok' | 'restricted' | 'unknown';
  zoneNames: string[];
}

// Gleiche Layer-Liste wie im Dashboard (drohne-dashboard/src/components/DrohneMap.vue), damit
// Bot und Kartenansicht dieselben Zonen kennen. Eine ursprünglich kleinere Teilmenge (nur die
// "offensichtlichen" Verbotszonen) hatte reale Treffer übersehen, z.B. in bundesautobahnen,
// krankenhaeuser oder militaerische_anlagen — daher jetzt die volle Liste, abgeglichen mit den
// tatsächlich per WFS abfragbaren Feature-Types (docs/geoserver-GetCapabilities_application.xml),
// minus zwei Layern, die dort NICHT als WFS-Feature-Type existieren (nur WMS/visuell):
// - modellflugplaetze (WFS antwortet mit "Feature type dipul:modellflugplaetze unknown")
// - inaktive_temporaere_betriebseinschraenkungen (zudem per Definition nicht aktuell gültig,
//   würde fälschlich als "restricted" gemeldet werden)
const LAYER_LABELS: Record<string, string> = {
  flugplaetze: 'Flugplatz',
  flughaefen: 'Flughafen',
  kontrollzonen: 'Kontrollzone (Flughafen)',
  flugbeschraenkungsgebiete: 'Flugbeschränkungsgebiet',
  bundesautobahnen: 'Bundesautobahn',
  bundesstrassen: 'Bundesstraße',
  bahnanlagen: 'Bahnanlage',
  binnenwasserstrassen: 'Binnenwasserstraße',
  seewasserstrassen: 'Seewasserstraße',
  schifffahrtsanlagen: 'Schifffahrtsanlage',
  wohngrundstuecke: 'Wohngrundstück (100m-Zone)',
  freibaeder: 'Freibad',
  industrieanlagen: 'Industrieanlage',
  kraftwerke: 'Kraftwerk',
  umspannwerke: 'Umspannwerk',
  stromleitungen: 'Stromleitung',
  windkraftanlagen: 'Windkraftanlage',
  justizvollzugsanstalten: 'Justizvollzugsanstalt',
  militaerische_anlagen: 'Militärische Anlage',
  labore: 'Labor (Sicherheitsstufe)',
  behoerden: 'Behörde',
  diplomatische_vertretungen: 'Diplomatische Vertretung',
  internationale_organisationen: 'Internationale Organisation',
  polizei: 'Polizei',
  sicherheitsbehoerden: 'Sicherheitsbehörde',
  krankenhaeuser: 'Krankenhaus',
  nationalparks: 'Nationalpark',
  naturschutzgebiete: 'Naturschutzgebiet',
  'ffh-gebiete': 'FFH-Gebiet',
  vogelschutzgebiete: 'Vogelschutzgebiet',
  temporaere_betriebseinschraenkungen: 'Temporäre Betriebseinschränkung',
};

export const CHECK_LAYERS = Object.keys(LAYER_LABELS);

// Für Verkehrswege gilt die "1:1-Regel": Betrieb ist bedingt möglich, wenn der horizontale
// Abstand zur Anlage mindestens der Flughöhe entspricht — anders als bei echten Sperrzonen
// (Kontrollzone, Militär, Krankenhaus, ...), wo grundsätzlich nicht geflogen werden darf.
const CONDITIONAL_FLIGHT_LAYERS = [
  'bundesstrassen',
  'bahnanlagen',
  'bundesautobahnen',
  'binnenwasserstrassen',
  'seewasserstrassen',
  'schifffahrtsanlagen',
];

export const CONDITIONAL_ZONE_LABELS = new Set(
  CONDITIONAL_FLIGHT_LAYERS.map((l) => LAYER_LABELS[l])
);

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// GeoServer behandelt einen CQL_FILTER über mehrere typeNames in einer Anfrage als Join
// und lehnt eine simple räumliche Bedingung dafür ab ("invalid join sub-filter"). Daher pro
// Layer eine eigene GetFeature-Anfrage — count=1, da nur "Treffer ja/nein" interessiert.
async function layerHasFeature(layer: string, lat: number, lng: number): Promise<boolean> {
  const url = new URL(config.dipulWfsUrl);
  url.searchParams.set('service', 'WFS');
  url.searchParams.set('version', '2.0.0');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('typeNames', `dipul:${layer}`);
  url.searchParams.set('outputFormat', 'application/json');
  url.searchParams.set('srsName', 'EPSG:4326');
  // Geometrie-Attribut "geom" ist GeoServer-Standard, aber pro Layer nicht garantiert
  // (siehe offener Punkt in der Architektur) — bei Bedarf per DescribeFeatureType prüfen.
  //
  // Achsreihenfolge im CQL_FILTER ist lat,lng (nicht lng,lat wie ursprünglich im Architektur-
  // Doc angenommen und noch nicht verifiziert war): dieser WFS-Dienst wertet POINT() bei
  // srsName=EPSG:4326 in der "CRS-konformen" Reihenfolge lat/lon aus, obwohl die zurückgelieferten
  // GeoJSON-Geometrien selbst ganz normal in lng/lat vorliegen. Live gegen die Frankfurt-
  // Kontrollzone verifiziert: POINT(lng lat) lieferte 0 Treffer, POINT(lat lng) den korrekten Treffer.
  url.searchParams.set('CQL_FILTER', `INTERSECTS(geom,POINT(${lat} ${lng}))`);
  url.searchParams.set('count', '1');

  const res = await fetchWithTimeout(url.toString(), 8000);
  if (!res.ok) throw new Error(`DIPUL-WFS (${layer}) antwortete mit HTTP ${res.status}`);

  const data = (await res.json()) as { features?: unknown[] };
  return (data.features?.length ?? 0) > 0;
}

export async function checkZones(lat: number, lng: number): Promise<ZoneCheckResult> {
  const results = await Promise.allSettled(
    CHECK_LAYERS.map((layer) => layerHasFeature(layer, lat, lng))
  );

  const zoneNames = new Set<string>();
  let anyFailed = false;

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      anyFailed = true;
      return;
    }
    if (result.value) zoneNames.add(LAYER_LABELS[CHECK_LAYERS[i]]);
  });

  if (zoneNames.size > 0) return { status: 'restricted', zoneNames: [...zoneNames] };
  // Ohne Treffer, aber mit mindestens einer fehlgeschlagenen Layer-Abfrage können wir
  // "keine Zone betroffen" nicht garantieren -> lieber unknown als ein falsches "ok".
  if (anyFailed) return { status: 'unknown', zoneNames: [] };
  return { status: 'ok', zoneNames: [] };
}
