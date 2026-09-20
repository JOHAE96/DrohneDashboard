import sharp from 'sharp';
import { config } from '../config.js';
import { CHECK_LAYERS } from './dipul.js';

const IMAGE_SIZE = 512;
const HALF_SPAN_DEG = 0.01; // ~1-2km Kartenausschnitt um den Punkt, genug für einen schnellen Sichtcheck

export async function buildZoneMapImage(lat: number, lng: number): Promise<Buffer> {
  const minLat = lat - HALF_SPAN_DEG;
  const maxLat = lat + HALF_SPAN_DEG;
  const minLng = lng - HALF_SPAN_DEG;
  const maxLng = lng + HALF_SPAN_DEG;

  const url = new URL(config.dipulWmsUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('request', 'GetMap');
  url.searchParams.set('layers', CHECK_LAYERS.map((l) => `dipul:${l}`).join(','));
  url.searchParams.set('styles', '');
  url.searchParams.set('format', 'image/png');
  url.searchParams.set('transparent', 'true');
  url.searchParams.set('width', String(IMAGE_SIZE));
  url.searchParams.set('height', String(IMAGE_SIZE));
  url.searchParams.set('crs', 'EPSG:4326');
  // WMS 1.3.0 vertauscht bei EPSG:4326 die Achsreihenfolge: BBOX = minLat,minLng,maxLat,maxLng
  // (anders als WMS 1.1.x oder WFS, wo lng/lat bzw. x/y gilt).
  url.searchParams.set('bbox', `${minLat},${minLng},${maxLat},${maxLng}`);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`DIPUL-WMS-Anfrage fehlgeschlagen: ${res.status}`);
  }
  const zonesLayer = Buffer.from(await res.arrayBuffer());

  const marker = Buffer.from(
    `<svg width="${IMAGE_SIZE}" height="${IMAGE_SIZE}">
      <circle cx="${IMAGE_SIZE / 2}" cy="${IMAGE_SIZE / 2}" r="8" fill="#e53e3e" stroke="white" stroke-width="3" />
    </svg>`
  );

  const background = await sharp({
    create: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      channels: 4,
      background: { r: 240, g: 240, b: 235, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: zonesLayer }, { input: marker }])
    .png()
    .toBuffer();
}
