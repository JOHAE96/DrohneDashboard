import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH ??= ':memory:';

const { buildApp } = await import('../index.js');
const { db } = await import('../db.js');

beforeEach(() => {
  db.exec('DELETE FROM confirmations; DELETE FROM spots;');
});

const VALID_SPOT = {
  lat: 50.9281745,
  lng: 11.5944213,
  originalMapsLink: 'https://maps.app.goo.gl/34RRdMdeiuuXoYai7',
  suggestedBy: 'testuser',
  discordMessageId: 'msg-1',
  discordMessageLink: 'https://discord.com/channels/1/2/3',
  zoneStatus: 'restricted',
  zoneNames: ['Bundesstraße', 'Bahnanlage'],
};

describe('POST /api/spots', () => {
  test('legt einen Spot an und gibt ihn mit generierter id zurück', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/spots', payload: VALID_SPOT });
    assert.equal(res.statusCode, 201);

    const body = res.json();
    assert.ok(body.id);
    assert.equal(body.lat, VALID_SPOT.lat);
    assert.equal(body.originalMapsLink, VALID_SPOT.originalMapsLink);
    assert.deepEqual(body.zoneNames, VALID_SPOT.zoneNames);
    assert.equal(body.confirmationCount, 0);
  });

  test('lehnt fehlende Pflichtfelder ab', async () => {
    const app = buildApp();
    const { lat: _lat, ...withoutLat } = VALID_SPOT;
    const res = await app.inject({ method: 'POST', url: '/api/spots', payload: withoutLat });
    assert.equal(res.statusCode, 400);
  });

  test('description und zoneNames sind optional', async () => {
    const app = buildApp();
    const { description: _d, zoneNames: _z, ...minimal } = VALID_SPOT;
    const res = await app.inject({ method: 'POST', url: '/api/spots', payload: minimal });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.description, null);
    assert.deepEqual(body.zoneNames, []);
  });
});

describe('GET /api/spots', () => {
  test('listet Spots neueste zuerst, inkl. Bestätigungs-Anzahl', async () => {
    const app = buildApp();
    const first = (await app.inject({ method: 'POST', url: '/api/spots', payload: VALID_SPOT })).json();
    const second = (
      await app.inject({
        method: 'POST',
        url: '/api/spots',
        payload: { ...VALID_SPOT, discordMessageId: 'msg-2' },
      })
    ).json();

    await app.inject({
      method: 'POST',
      url: `/api/spots/${first.id}/confirmations`,
      payload: { name: 'Alice' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/spots' });
    assert.equal(res.statusCode, 200);
    const list = res.json() as Array<{ id: string; confirmationCount: number }>;
    assert.equal(list.length, 2);
    assert.equal(list[0].id, second.id); // neuester zuerst
    assert.equal(list.find((s) => s.id === first.id)?.confirmationCount, 1);
  });
});

describe('GET /api/spots/:id', () => {
  test('liefert Spot inkl. Bestätigungsliste', async () => {
    const app = buildApp();
    const created = (await app.inject({ method: 'POST', url: '/api/spots', payload: VALID_SPOT })).json();
    await app.inject({
      method: 'POST',
      url: `/api/spots/${created.id}/confirmations`,
      payload: { name: 'Bob' },
    });

    const res = await app.inject({ method: 'GET', url: `/api/spots/${created.id}` });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.confirmationCount, 1);
    assert.equal(body.confirmations.length, 1);
    assert.equal(body.confirmations[0].name, 'Bob');
  });

  test('404 für unbekannte id', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/spots/does-not-exist' });
    assert.equal(res.statusCode, 404);
  });
});

describe('POST /api/spots/:id/confirmations', () => {
  test('404, wenn der Spot nicht existiert', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/spots/does-not-exist/confirmations',
      payload: { name: 'Alice' },
    });
    assert.equal(res.statusCode, 404);
  });

  test('400, wenn name fehlt', async () => {
    const app = buildApp();
    const created = (await app.inject({ method: 'POST', url: '/api/spots', payload: VALID_SPOT })).json();
    const res = await app.inject({
      method: 'POST',
      url: `/api/spots/${created.id}/confirmations`,
      payload: {},
    });
    assert.equal(res.statusCode, 400);
  });
});

describe('GET /api/spots/by-message/:discordMessageId', () => {
  test('findet den Spot über die Discord-Message-ID', async () => {
    const app = buildApp();
    const created = (await app.inject({ method: 'POST', url: '/api/spots', payload: VALID_SPOT })).json();

    const res = await app.inject({
      method: 'GET',
      url: `/api/spots/by-message/${VALID_SPOT.discordMessageId}`,
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().id, created.id);
  });

  test('404 für unbekannte Message-ID', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/spots/by-message/unbekannt' });
    assert.equal(res.statusCode, 404);
  });
});
