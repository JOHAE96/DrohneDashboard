import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.DISCORD_TOKEN ??= 'test-token';
process.env.DISCORD_CLIENT_ID ??= 'test-client-id';
process.env.INTERNAL_API_URL ??= 'http://internal-api.test';

const { getZoneCheckCached } = await import('./zoneCheck.js');

function isCacheUrl(url: string): boolean {
  return url.startsWith('http://internal-api.test/api/zone-cache');
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe('getZoneCheckCached', () => {
  test('Cache-Hit: DIPUL-WFS wird gar nicht erst angefragt', async () => {
    let wfsCalls = 0;
    global.fetch = (async (input: string | URL) => {
      const url = input.toString();
      if (isCacheUrl(url)) {
        return jsonResponse({ status: 'restricted', zoneNames: ['Bahnanlage'] });
      }
      wfsCalls++;
      return jsonResponse({ features: [] });
    }) as typeof fetch;

    const result = await getZoneCheckCached(50.927, 11.589);
    assert.deepEqual(result, { status: 'restricted', zoneNames: ['Bahnanlage'] });
    assert.equal(wfsCalls, 0);
  });

  test('Cache-Miss: fragt DIPUL an und schreibt das Ergebnis anschließend in den Cache', async () => {
    let cacheWriteBody: unknown = null;
    global.fetch = (async (input: string | URL, init?: RequestInit) => {
      const url = input.toString();
      if (isCacheUrl(url)) {
        if (init?.method === 'POST') {
          cacheWriteBody = JSON.parse(init.body as string);
          return jsonResponse({}, true, 204);
        }
        return jsonResponse({ error: 'not found' }, false, 404);
      }
      return jsonResponse({ features: [] });
    }) as typeof fetch;

    const result = await getZoneCheckCached(50.927, 11.589);
    assert.deepEqual(result, { status: 'ok', zoneNames: [] });
    assert.deepEqual(cacheWriteBody, { lat: 50.927, lng: 11.589, status: 'ok', zoneNames: [] });
  });

  test('status "unknown" (z.B. Netzwerkfehler) wird nicht gecacht', async () => {
    let cacheWriteCalled = false;
    global.fetch = (async (input: string | URL, init?: RequestInit) => {
      const url = input.toString();
      if (isCacheUrl(url)) {
        if (init?.method === 'POST') cacheWriteCalled = true;
        return jsonResponse({ error: 'not found' }, false, 404);
      }
      throw new Error('network down');
    }) as typeof fetch;

    const result = await getZoneCheckCached(50.927, 11.589);
    assert.equal(result.status, 'unknown');
    assert.equal(cacheWriteCalled, false);
  });
});
