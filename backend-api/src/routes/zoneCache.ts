import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

interface ZoneCacheRow {
  lat: number;
  lng: number;
  status: string;
  zone_names: string;
  checked_at: string;
}

interface WriteZoneCacheBody {
  lat?: number;
  lng?: number;
  status?: string;
  zoneNames?: string[];
}

// Cache-Key: lat/lng werden vom Aufrufer (discord-bot) bereits gerundet übergeben (siehe
// roundCoord() in discord-bot/src/lib/apiClient.ts), damit nahe beieinanderliegende Anfragen
// auf denselben Eintrag treffen. Nur 'ok'/'restricted' werden gecacht, nie 'unknown'
// (transienter Fehler, kein verlässliches Ergebnis).
export async function zoneCacheRoutes(app: FastifyInstance) {
  app.get('/api/zone-cache', async (request, reply) => {
    const { lat, lng } = request.query as { lat?: string; lng?: string };
    if (lat === undefined || lng === undefined) {
      return reply.code(400).send({ error: 'lat und lng sind erforderlich' });
    }

    const row = db
      .prepare('SELECT * FROM zone_cache WHERE lat = ? AND lng = ?')
      .get(Number(lat), Number(lng)) as ZoneCacheRow | undefined;

    if (!row) return reply.code(404).send({ error: 'not found' });

    return {
      lat: row.lat,
      lng: row.lng,
      status: row.status,
      zoneNames: JSON.parse(row.zone_names) as string[],
      checkedAt: row.checked_at,
    };
  });

  app.post('/api/zone-cache', async (request, reply) => {
    const body = request.body as WriteZoneCacheBody;
    if (
      typeof body.lat !== 'number' ||
      typeof body.lng !== 'number' ||
      (body.status !== 'ok' && body.status !== 'restricted') ||
      !Array.isArray(body.zoneNames)
    ) {
      return reply
        .code(400)
        .send({ error: 'lat, lng, status ("ok"|"restricted") und zoneNames sind erforderlich' });
    }

    db.prepare(
      `INSERT INTO zone_cache (lat, lng, status, zone_names, checked_at)
       VALUES (@lat, @lng, @status, @zoneNames, datetime('now'))
       ON CONFLICT(lat, lng) DO UPDATE SET
         status = excluded.status,
         zone_names = excluded.zone_names,
         checked_at = excluded.checked_at`
    ).run({ lat: body.lat, lng: body.lng, status: body.status, zoneNames: JSON.stringify(body.zoneNames) });

    reply.code(204).send();
  });
}
