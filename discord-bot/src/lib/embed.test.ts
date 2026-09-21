import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DISCORD_TOKEN ??= 'test-token';
process.env.DISCORD_CLIENT_ID ??= 'test-client-id';

const { buildZoneEmbed } = await import('./embed.js');

function zoneField(embed: ReturnType<typeof buildZoneEmbed>) {
  return embed.toJSON().fields?.find((f) => f.name === 'Betroffene Zonen');
}

describe('buildZoneEmbed – Hinweis auf die 1:1-Regel für Verkehrswege', () => {
  test('kein "Betroffene Zonen"-Feld ohne Treffer', () => {
    const embed = buildZoneEmbed({
      lat: 50.927,
      lng: 11.589,
      zoneCheck: { status: 'ok', zoneNames: [] },
    });
    assert.equal(zoneField(embed), undefined);
  });

  test('nur harte Sperrzone: Bullet-Liste ohne 1:1-Hinweis', () => {
    const embed = buildZoneEmbed({
      lat: 50.927,
      lng: 11.589,
      zoneCheck: { status: 'restricted', zoneNames: ['Kontrollzone (Flughafen)'] },
    });
    const field = zoneField(embed);
    assert.equal(field?.value, '• Kontrollzone (Flughafen)');
    assert.ok(!field?.value.includes('1:1-Regel'));
  });

  test('konditionale Zone (Bahnanlage): Hinweis erscheint nach der Liste', () => {
    const embed = buildZoneEmbed({
      lat: 50.927,
      lng: 11.589,
      zoneCheck: { status: 'restricted', zoneNames: ['Bundesstraße', 'Bahnanlage'] },
    });
    const field = zoneField(embed);
    assert.equal(
      field?.value,
      '• Bundesstraße\n• Bahnanlage\n\n⚠️ Für Verkehrswege gilt die 1:1-Regel: Betrieb ist bedingt möglich, wenn der horizontale Abstand zur Anlage mindestens der Flughöhe entspricht.'
    );
  });

  test('Mix aus konditional + hart: Hinweis erscheint trotzdem, alle Zonen bleiben gelistet', () => {
    const embed = buildZoneEmbed({
      lat: 50.927,
      lng: 11.589,
      zoneCheck: { status: 'restricted', zoneNames: ['Bundesstraße', 'Naturschutzgebiet'] },
    });
    const field = zoneField(embed);
    assert.ok(field?.value.startsWith('• Bundesstraße\n• Naturschutzgebiet'));
    assert.ok(field?.value.includes('1:1-Regel'));
  });

  for (const label of ['Bundesautobahn', 'Binnenwasserstraße', 'Seewasserstraße', 'Schifffahrtsanlage']) {
    test(`konditionale Zone "${label}": Hinweis erscheint`, () => {
      const embed = buildZoneEmbed({
        lat: 50.927,
        lng: 11.589,
        zoneCheck: { status: 'restricted', zoneNames: [label] },
      });
      assert.ok(zoneField(embed)?.value.includes('1:1-Regel'));
    });
  }
});
