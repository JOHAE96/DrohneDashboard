import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// dipul.ts importiert config.ts, das beim Laden DISCORD_TOKEN/DISCORD_CLIENT_ID verlangt
// (siehe config.ts required()). Für diesen Test sind die Werte irrelevant, müssen aber
// gesetzt sein, bevor das Modul importiert wird — daher dynamischer Import nach dem Setzen.
process.env.DISCORD_TOKEN ??= 'test-token';
process.env.DISCORD_CLIENT_ID ??= 'test-client-id';

const { checkZones, CHECK_LAYERS } = await import('./dipul.js');

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

function featureResponse(hasFeature: boolean): Response {
  return jsonResponse({ features: hasFeature ? [{ id: 'x.1' }] : [] });
}

function layerFromUrl(url: string): string {
  const typeNames = new URL(url).searchParams.get('typeNames') ?? '';
  return typeNames.replace(/^dipul:/, '');
}

const originalFetch = global.fetch;
const requestedUrls: string[] = [];

/** handler bekommt den angefragten Layer-Namen (ohne "dipul:"-Präfix) und liefert die Response/wirft. */
function mockFetchPerLayer(handler: (layer: string) => Response | Promise<Response>) {
  global.fetch = (async (input: string | URL) => {
    const url = input.toString();
    requestedUrls.push(url);
    return handler(layerFromUrl(url));
  }) as typeof fetch;
}

afterEach(() => {
  global.fetch = originalFetch;
  requestedUrls.length = 0;
});

describe('checkZones – Anfrage-Aufbau', () => {
  test('fragt jeden Check-Layer einzeln ab (kein kombinierter Multi-Layer-CQL_FILTER)', async () => {
    mockFetchPerLayer(() => featureResponse(false));
    await checkZones(50.927, 11.589);

    assert.equal(requestedUrls.length, CHECK_LAYERS.length);
    const queriedLayers = requestedUrls.map(layerFromUrl).sort();
    assert.deepEqual(queriedLayers, [...CHECK_LAYERS].sort());
  });

  test('setzt WFS-Parameter und POINT(lat lng) im CQL_FILTER pro Anfrage', async () => {
    mockFetchPerLayer(() => featureResponse(false));
    await checkZones(50.927, 11.589);

    for (const requested of requestedUrls) {
      const url = new URL(requested);
      assert.equal(url.searchParams.get('service'), 'WFS');
      assert.equal(url.searchParams.get('version'), '2.0.0');
      assert.equal(url.searchParams.get('request'), 'GetFeature');
      assert.equal(url.searchParams.get('outputFormat'), 'application/json');
      assert.equal(url.searchParams.get('srsName'), 'EPSG:4326');
      assert.equal(url.searchParams.get('count'), '1');
      // lat vor lng: live gegen die Frankfurt-Kontrollzone verifiziert (POINT(lng lat) lieferte
      // 0 Treffer trotz Punkt mitten in der Zone) — entgegen der ursprünglichen, unverifizierten
      // Annahme im Architektur-Doc.
      assert.equal(url.searchParams.get('CQL_FILTER'), 'INTERSECTS(geom,POINT(50.927 11.589))');
    }
  });
});

describe('checkZones – Auswertung der Antwort', () => {
  test('status "ok", wenn kein Layer einen Treffer liefert', async () => {
    mockFetchPerLayer(() => featureResponse(false));
    const result = await checkZones(50.927, 11.589);
    assert.deepEqual(result, { status: 'ok', zoneNames: [] });
  });

  test('status "restricted" mit lesbarem Namen, wenn genau ein Layer trifft', async () => {
    mockFetchPerLayer((layer) => featureResponse(layer === 'kontrollzonen'));
    const result = await checkZones(50.927, 11.589);
    assert.equal(result.status, 'restricted');
    assert.deepEqual(result.zoneNames, ['Kontrollzone (Flughafen)']);
  });

  test('sammelt mehrere unterschiedliche Zonen', async () => {
    mockFetchPerLayer((layer) =>
      featureResponse(layer === 'kontrollzonen' || layer === 'naturschutzgebiete')
    );
    const result = await checkZones(50.927, 11.589);
    assert.equal(result.status, 'restricted');
    assert.deepEqual(
      new Set(result.zoneNames),
      new Set(['Kontrollzone (Flughafen)', 'Naturschutzgebiet'])
    );
  });

  test('Treffer schlägt Fehler: "restricted" bleibt bestehen, auch wenn ein anderer Layer fehlschlägt', async () => {
    mockFetchPerLayer((layer) => {
      if (layer === 'kontrollzonen') return featureResponse(true);
      if (layer === 'nationalparks') throw new Error('timeout');
      return featureResponse(false);
    });
    const result = await checkZones(50.927, 11.589);
    assert.equal(result.status, 'restricted');
    assert.deepEqual(result.zoneNames, ['Kontrollzone (Flughafen)']);
  });
});

describe('checkZones – Fehlerfälle ergeben "unknown" statt einem falschen "ok"', () => {
  test('HTTP-Fehler bei einem einzelnen Layer, sonst keine Treffer', async () => {
    mockFetchPerLayer((layer) => {
      if (layer === 'wohngrundstuecke') return jsonResponse({}, false, 500);
      return featureResponse(false);
    });
    const result = await checkZones(50.927, 11.589);
    assert.deepEqual(result, { status: 'unknown', zoneNames: [] });
  });

  test('Netzwerkfehler bei allen Layern', async () => {
    global.fetch = (async () => {
      throw new Error('network down');
    }) as typeof fetch;
    const result = await checkZones(50.927, 11.589);
    assert.deepEqual(result, { status: 'unknown', zoneNames: [] });
  });

  test('ungültiges JSON in der Antwort eines Layers', async () => {
    mockFetchPerLayer((layer) => {
      if (layer === 'kontrollzonen') {
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token');
          },
        } as unknown as Response;
      }
      return featureResponse(false);
    });
    const result = await checkZones(50.927, 11.589);
    assert.deepEqual(result, { status: 'unknown', zoneNames: [] });
  });
});
