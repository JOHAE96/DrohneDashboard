import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  findGoogleMapsUrls,
  extractCoordsFromUrl,
  parseRawCoordinates,
  resolveGoogleMapsUrl,
} from './googleMaps.js';

describe('findGoogleMapsUrls', () => {
  test('erkennt einen Kurzlink in Fließtext', () => {
    const text = 'schau mal hier https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8 cooler spot';
    assert.deepEqual(findGoogleMapsUrls(text), ['https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8']);
  });

  test('erkennt mehrere unterschiedliche Links, dedupliziert aber gleiche', () => {
    const text = [
      'https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8',
      'https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8',
      'https://www.google.com/maps/@50.9,11.5,15z',
    ].join(' ');
    assert.deepEqual(findGoogleMapsUrls(text), [
      'https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8',
      'https://www.google.com/maps/@50.9,11.5,15z',
    ]);
  });

  test('ignoriert Text ohne Maps-Link', () => {
    assert.deepEqual(findGoogleMapsUrls('kein Link hier, nur Text'), []);
  });
});

describe('extractCoordsFromUrl – reale, aufgelöste Place-Links', () => {
  const cases: Array<[string, string, { lat: number; lng: number }]> = [
    [
      'Steinkreuz',
      'https://www.google.de/maps/place/Steinkreuz/@50.9221101,11.6328469,2299m/data=!3m1!1e3!4m6!3m5!1s0x47a6af005a84a311:0x25ef9718831d8484!8m2!3d50.914437!4d11.63956!16s%2Fg%2F11ltb7v8jx?entry=tts',
      { lat: 50.914437, lng: 11.63956 },
    ],
    [
      'Aussichtspunkt Gembdenbach',
      'https://www.google.de/maps/place/Aussichtspunkt+Gembdenbach/@50.9221101,11.6328469,2299m/data=!3m1!1e3!4m6!3m5!1s0x47a6afafb386e291:0x54e84ae650ab19b9!8m2!3d50.9222988!4d11.6422352!16s%2Fg%2F11t6nzvh57?entry=tts',
      { lat: 50.9222988, lng: 11.6422352 },
    ],
    [
      'Landfeste',
      'https://www.google.de/maps/place/Landfeste/@50.9271357,11.5912163,417m/data=!3m1!1e3!4m6!3m5!1s0x47a6a9e1dd7abad1:0x16ea3d79eef23876!8m2!3d50.9281745!4d11.5944213!16s%2Fg%2F11gl133ry2?entry=tts',
      { lat: 50.9281745, lng: 11.5944213 },
    ],
    [
      'Koordinaten-Pin ohne Ortsnamen',
      "https://www.google.de/maps/place/50%C2%B055'39.9%22N+11%C2%B034'58.1%22E/@50.92767,11.5814882,335m/data=!3m1!1e3!4m4!3m3!8m2!3d50.927753!4d11.582811?entry=tts",
      { lat: 50.927753, lng: 11.582811 },
    ],
  ];

  for (const [label, url, expected] of cases) {
    test(`${label}: nutzt den präzisen Pin (!3d!4d), nicht den Viewport-Mittelpunkt (@)`, () => {
      assert.deepEqual(extractCoordsFromUrl(url), expected);
    });
  }

  test('fällt auf @lat,lng zurück, wenn kein !3d!4d-Pin vorhanden ist', () => {
    assert.deepEqual(extractCoordsFromUrl('https://www.google.com/maps/@50.9,11.5,15z'), {
      lat: 50.9,
      lng: 11.5,
    });
  });

  test('erkennt ?q=lat,lng', () => {
    assert.deepEqual(extractCoordsFromUrl('https://maps.google.com/?q=50.9,11.5'), {
      lat: 50.9,
      lng: 11.5,
    });
  });

  test('liefert null ohne jegliche Koordinaten in der URL', () => {
    assert.equal(extractCoordsFromUrl('https://www.google.de/maps/place/Irgendwo'), null);
  });
});

describe('parseRawCoordinates', () => {
  test('parst "lat,lng"', () => {
    assert.deepEqual(parseRawCoordinates('50.927,11.589'), { lat: 50.927, lng: 11.589 });
  });

  test('erlaubt Leerzeichen nach dem Komma', () => {
    assert.deepEqual(parseRawCoordinates('50.927, 11.589'), { lat: 50.927, lng: 11.589 });
  });

  test('lehnt Werte außerhalb des gültigen Bereichs ab', () => {
    assert.equal(parseRawCoordinates('120,11.589'), null);
    assert.equal(parseRawCoordinates('50.9,200'), null);
  });

  test('lehnt Freitext ab', () => {
    assert.equal(parseRawCoordinates('Steinkreuz Jena'), null);
  });
});

describe('resolveGoogleMapsUrl – Kurzlink-Pipeline (Redirect gemockt, keine echten Requests)', () => {
  const REDIRECTS: Record<string, string> = {
    'https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8':
      'https://www.google.de/maps/place/Steinkreuz/@50.9221101,11.6328469,2299m/data=!3m1!1e3!4m6!3m5!1s0x47a6af005a84a311:0x25ef9718831d8484!8m2!3d50.914437!4d11.63956!16s%2Fg%2F11ltb7v8jx?entry=tts',
    'https://maps.app.goo.gl/KAaeYAoqKhqb4J2B6':
      'https://www.google.de/maps/place/Aussichtspunkt+Gembdenbach/@50.9221101,11.6328469,2299m/data=!3m1!1e3!4m6!3m5!1s0x47a6afafb386e291:0x54e84ae650ab19b9!8m2!3d50.9222988!4d11.6422352!16s%2Fg%2F11t6nzvh57?entry=tts',
    'https://maps.app.goo.gl/34RRdMdeiuuXoYai7':
      'https://www.google.de/maps/place/Landfeste/@50.9271357,11.5912163,417m/data=!3m1!1e3!4m6!3m5!1s0x47a6a9e1dd7abad1:0x16ea3d79eef23876!8m2!3d50.9281745!4d11.5944213!16s%2Fg%2F11gl133ry2?entry=tts',
    'https://maps.app.goo.gl/HQjcNgjzRYFUQQ7i6':
      "https://www.google.de/maps/place/50%C2%B055'39.9%22N+11%C2%B034'58.1%22E/@50.92767,11.5814882,335m/data=!3m1!1e3!4m4!3m3!8m2!3d50.927753!4d11.582811?entry=tts",
  };

  const originalFetch = global.fetch;

  function mockFetch(location: string | null) {
    global.fetch = (async () =>
      ({
        headers: { get: (name: string) => (name.toLowerCase() === 'location' ? location : null) },
      }) as Response) as typeof fetch;
  }

  beforeEach(() => {
    global.fetch = (async (input: string | URL) => {
      const url = input.toString();
      const location = REDIRECTS[url];
      if (!location) throw new Error(`Unerwarteter fetch-Aufruf in Test: ${url}`);
      return {
        headers: { get: (name: string) => (name.toLowerCase() === 'location' ? location : null) },
      } as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const expectations: Array<[string, { lat: number; lng: number }]> = [
    ['https://maps.app.goo.gl/xoi8zX7hXQTxWxhS8', { lat: 50.914437, lng: 11.63956 }],
    ['https://maps.app.goo.gl/KAaeYAoqKhqb4J2B6', { lat: 50.9222988, lng: 11.6422352 }],
    ['https://maps.app.goo.gl/34RRdMdeiuuXoYai7', { lat: 50.9281745, lng: 11.5944213 }],
    ['https://maps.app.goo.gl/HQjcNgjzRYFUQQ7i6', { lat: 50.927753, lng: 11.582811 }],
  ];

  for (const [shortUrl, expected] of expectations) {
    test(`löst ${shortUrl} korrekt auf`, async () => {
      const result = await resolveGoogleMapsUrl(shortUrl);
      assert.ok(result);
      assert.equal(result.lat, expected.lat);
      assert.equal(result.lng, expected.lng);
      assert.equal(result.sourceUrl, shortUrl);
    });
  }

  test('gibt null zurück, wenn der aufgelöste Link keine Koordinaten enthält', async () => {
    mockFetch('https://www.google.de/maps/place/Irgendwo');
    const result = await resolveGoogleMapsUrl('https://maps.app.goo.gl/unbekannt');
    assert.equal(result, null);
  });

  test('gibt null zurück, wenn der Redirect keinen Location-Header liefert', async () => {
    mockFetch(null);
    const result = await resolveGoogleMapsUrl('https://maps.app.goo.gl/unbekannt');
    assert.equal(result, null);
  });
});
