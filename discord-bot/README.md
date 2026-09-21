# Drohnen-Spot Discord-Bot (v1)

Erkennt Google-Maps-Links in Nachrichten und prüft die Position per Slash-Command
(`/check`) gegen die DIPUL-Verbots-/Kontrollzonen. Antwortet mit Zonen-Status und
einem generierten Kartenbild (DIPUL-WMS-Zonen + Marker).

v1-Scope: nur der Bot, ohne Backend-API/SQLite/Dashboard-Anbindung (siehe
`../docs/architektur-drohnen-spot-bot.md` für die geplante Vollausbaustufe).

## Discord-App einrichten

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot → Token kopieren → `DISCORD_TOKEN`
3. Bot → Privileged Gateway Intents → **Message Content Intent** aktivieren
   (nötig, um Links im Nachrichtentext zu erkennen)
4. General Information → Application ID → `DISCORD_CLIENT_ID`
5. OAuth2 → URL Generator: Scopes `bot`, `applications.commands`;
   Bot-Permissions `Send Messages`, `Read Message History`, `Attach Files`,
   `Use Slash Commands` → Einladelink im gewünschten Server öffnen

## Lokale Entwicklung

```bash
cp .env.example .env   # Werte eintragen
npm install
npm run deploy-commands  # registriert /check (mit DISCORD_GUILD_ID: sofort, sonst bis zu 1h)
npm run dev
```

## Tests

```bash
npm test
```

Unit-Tests für Link-/Koordinaten-Erkennung (`src/lib/googleMaps.ts`, u.a. mit vier realen
`maps.app.goo.gl`-Kurzlinks als Fixtures) sowie den DIPUL-WFS-Zonencheck (`src/lib/dipul.ts`:
Request-Aufbau, Zonen-Auswertung, Fehlerfälle). Keine echten Netzwerkaufrufe, `fetch` ist
jeweils gemockt — `mapImage.ts` (WMS-Bildgenerierung) ist noch ungetestet.

## Docker

```bash
cp discord-bot/.env.example discord-bot/.env   # Werte eintragen
docker compose build
docker compose up -d
docker compose run --rm discord-bot npm run deploy-commands
```

## Grenzen der v1

- Keine Speicherung von Spots (keine DB, kein Dashboard-Abgleich)
- Deep-Link-Format `https://maptool-dipul.dfs.de/geozones/@{lng},{lat}` ist nicht
  offiziell dokumentiert (nur beobachtet) — ggf. Zoom-Parameter oder Formatänderungen beachten
- Geometrie-Attributname `geom` im WFS-Filter ist GeoServer-Standard, aber nicht
  pro Layer verifiziert (offener Punkt aus der Architektur)
