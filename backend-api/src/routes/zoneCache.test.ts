import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH ??= ':memory:';

const { buildApp } = await import('../index.js');
const { db } = await import('../db.js');

beforeEach(() => {
  db.exec('DELETE FROM zone_cache;');
});

describe('GET /api/zone-cache', () => {
  test('404, wenn nichts gecacht ist', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/zone-cache?lat=50.927&lng=11.589' });
    assert.equal(res.statusCode, 404);
  });

  test('400, wenn lat oder lng fehlen', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/zone-cache?lat=50.927' });
    assert.equal(res.statusCode, 400);
  });
});

describe('POST /api/zone-cache', () => {
  test('legt einen Cache-Eintrag an, der danach per GET lesbar ist', async () => {
    const app = buildApp();
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/zone-cache',
      payload: { lat: 50.927, lng: 11.589, status: 'restricted', zoneNames: ['Bundesstraße'] },
    });
    assert.equal(postRes.statusCode, 204);

    const getRes = await app.inject({ method: 'GET', url: '/api/zone-cache?lat=50.927&lng=11.589' });
    assert.equal(getRes.statusCode, 200);
    const body = getRes.json();
    assert.equal(body.status, 'restricted');
    assert.deepEqual(body.zoneNames, ['Bundesstraße']);
  });

  test('überschreibt einen bestehenden Eintrag für dieselbe Position (upsert)', async () => {
    const app = buildApp();
    await app.inject({
      method: 'POST',
      url: '/api/zone-cache',
      payload: { lat: 50.927, lng: 11.589, status: 'ok', zoneNames: [] },
    });
    await app.inject({
      method: 'POST',
      url: '/api/zone-cache',
      payload: { lat: 50.927, lng: 11.589, status: 'restricted', zoneNames: ['Naturschutzgebiet'] },
    });

    const getRes = await app.inject({ method: 'GET', url: '/api/zone-cache?lat=50.927&lng=11.589' });
    const body = getRes.json();
    assert.equal(body.status, 'restricted');
    assert.deepEqual(body.zoneNames, ['Naturschutzgebiet']);
  });

  test('lehnt status "unknown" ab (nur ok/restricted werden gecacht)', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/zone-cache',
      payload: { lat: 50.927, lng: 11.589, status: 'unknown', zoneNames: [] },
    });
    assert.equal(res.statusCode, 400);
  });

  test('lehnt fehlende Felder ab', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/zone-cache',
      payload: { lat: 50.927 },
    });
    assert.equal(res.statusCode, 400);
  });
});
