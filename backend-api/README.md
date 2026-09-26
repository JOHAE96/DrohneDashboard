# Drohnen-Spot Backend-API (v2)

Fastify + `better-sqlite3`. Verwaltet Spots/Bestätigungen sowie einen Cache für
DIPUL-Zonenprüfungen — Details siehe `../docs/architektur-drohnen-spot-bot.md` Abschnitt 4/5.

Nur der discord-bot spricht diese API an (internes Docker-Netzwerk, `INTERNAL_API_URL`).
Kein Traefik-Routing/Basic-Auth in v2 — noch kein Dashboard-Zugriff, kommt mit der
Dashboard-Erweiterung.

## Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/health` | Liveness-Check |
| `GET` | `/api/spots` | Alle Spots inkl. Bestätigungs-Anzahl, neueste zuerst |
| `POST` | `/api/spots` | Neuen Spot anlegen (nur vom automatischen Link-Scan im Bot, **nicht** von `/check`) |
| `GET` | `/api/spots/:id` | Einzelner Spot inkl. Bestätigungsliste |
| `POST` | `/api/spots/:id/confirmations` | Bestätigung hinzufügen (`{ name: string }`) |
| `GET` | `/api/spots/by-message/:discordMessageId` | Spot über Discord-Message-ID finden |
| `GET` | `/api/zone-cache?lat=&lng=` | Gecachtes DIPUL-Ergebnis für eine (gerundete) Position, 404 wenn keins vorhanden |
| `POST` | `/api/zone-cache` | Ergebnis cachen (`{ lat, lng, status: "ok"\|"restricted", zoneNames }`, upsert) — `/check` schreibt **nur** hierher |

## Lokale Entwicklung

```bash
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
npm test
```

`node:test` gegen eine In-Memory-SQLite-DB (`DB_PATH=:memory:`), Requests über
`app.inject()` ohne echten Netzwerk-Server.

## Docker

Läuft über das Root-`docker-compose.yml` als Teil des Gesamt-Stacks (`api`-Service),
mit einem benannten Volume (`sqlite-data:/data`) für `spots.db`.
