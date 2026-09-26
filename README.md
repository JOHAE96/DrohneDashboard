# DrohneDashboard

Monorepo mit drei Teilprojekten:

- [`drohne-dashboard/`](drohne-dashboard/) — Vue 3 + Leaflet Karte für No-Fly-Zones/NOTAMs
- [`discord-bot/`](discord-bot/) — Discord-Bot: erkennt Google-Maps-Links, prüft sie gegen die DIPUL-Zonen (`/check`)
- [`backend-api/`](backend-api/) — Fastify + SQLite: Spot-Speicherung und Zonen-Cache für den Bot (v2, kein Dashboard-Zugriff bisher)

Architektur & Ausbaustufen: [docs/architektur-drohnen-spot-bot.md](docs/architektur-drohnen-spot-bot.md)
