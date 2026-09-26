import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

interface SpotRow {
  id: string;
  lat: number;
  lng: number;
  original_maps_link: string;
  description: string | null;
  suggested_by: string;
  discord_message_id: string;
  discord_message_link: string;
  created_at: string;
  zone_status: string;
  zone_names: string | null;
}

interface CreateSpotBody {
  lat?: number;
  lng?: number;
  originalMapsLink?: string;
  description?: string;
  suggestedBy?: string;
  discordMessageId?: string;
  discordMessageLink?: string;
  zoneStatus?: string;
  zoneNames?: string[];
}

const REQUIRED_SPOT_FIELDS = [
  'lat',
  'lng',
  'originalMapsLink',
  'suggestedBy',
  'discordMessageId',
  'discordMessageLink',
  'zoneStatus',
] as const satisfies readonly (keyof CreateSpotBody)[];

function serializeSpot(row: SpotRow, confirmationCount: number) {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    originalMapsLink: row.original_maps_link,
    description: row.description,
    suggestedBy: row.suggested_by,
    discordMessageId: row.discord_message_id,
    discordMessageLink: row.discord_message_link,
    createdAt: row.created_at,
    zoneStatus: row.zone_status,
    zoneNames: row.zone_names ? (JSON.parse(row.zone_names) as string[]) : [],
    confirmationCount,
  };
}

export async function spotRoutes(app: FastifyInstance) {
  app.get('/api/spots', async () => {
    const rows = db
      .prepare(
        `SELECT s.*, COUNT(c.id) as confirmation_count
         FROM spots s
         LEFT JOIN confirmations c ON c.spot_id = s.id
         GROUP BY s.id
         ORDER BY s.created_at DESC, s.rowid DESC`
      )
      .all() as (SpotRow & { confirmation_count: number })[];

    return rows.map((row) => serializeSpot(row, row.confirmation_count));
  });

  app.post('/api/spots', async (request, reply) => {
    const body = request.body as CreateSpotBody;

    for (const field of REQUIRED_SPOT_FIELDS) {
      if (body[field] === undefined) {
        return reply.code(400).send({ error: `${field} ist erforderlich` });
      }
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO spots
         (id, lat, lng, original_maps_link, description, suggested_by, discord_message_id, discord_message_link, zone_status, zone_names)
       VALUES
         (@id, @lat, @lng, @originalMapsLink, @description, @suggestedBy, @discordMessageId, @discordMessageLink, @zoneStatus, @zoneNames)`
    ).run({
      id,
      lat: body.lat,
      lng: body.lng,
      originalMapsLink: body.originalMapsLink,
      description: body.description ?? null,
      suggestedBy: body.suggestedBy,
      discordMessageId: body.discordMessageId,
      discordMessageLink: body.discordMessageLink,
      zoneStatus: body.zoneStatus,
      zoneNames: JSON.stringify(body.zoneNames ?? []),
    });

    const row = db.prepare('SELECT * FROM spots WHERE id = ?').get(id) as SpotRow;
    reply.code(201).send(serializeSpot(row, 0));
  });

  app.get('/api/spots/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.prepare('SELECT * FROM spots WHERE id = ?').get(id) as SpotRow | undefined;
    if (!row) return reply.code(404).send({ error: 'not found' });

    const confirmations = db
      .prepare('SELECT id, name, confirmed_at FROM confirmations WHERE spot_id = ? ORDER BY confirmed_at ASC')
      .all(id) as { id: number; name: string; confirmed_at: string }[];

    return {
      ...serializeSpot(row, confirmations.length),
      confirmations: confirmations.map((c) => ({ id: c.id, name: c.name, confirmedAt: c.confirmed_at })),
    };
  });

  app.post('/api/spots/:id/confirmations', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string };
    if (!body.name) return reply.code(400).send({ error: 'name ist erforderlich' });

    const spot = db.prepare('SELECT id FROM spots WHERE id = ?').get(id);
    if (!spot) return reply.code(404).send({ error: 'spot not found' });

    db.prepare('INSERT INTO confirmations (spot_id, name) VALUES (?, ?)').run(id, body.name);
    reply.code(201).send({ ok: true });
  });

  app.get('/api/spots/by-message/:discordMessageId', async (request, reply) => {
    const { discordMessageId } = request.params as { discordMessageId: string };
    const row = db.prepare('SELECT * FROM spots WHERE discord_message_id = ?').get(discordMessageId) as
      | SpotRow
      | undefined;
    if (!row) return reply.code(404).send({ error: 'not found' });

    const { c: confirmationCount } = db
      .prepare('SELECT COUNT(*) as c FROM confirmations WHERE spot_id = ?')
      .get(row.id) as { c: number };

    return serializeSpot(row, confirmationCount);
  });
}
