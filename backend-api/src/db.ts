import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

if (config.dbPath !== ':memory:') {
  mkdirSync(dirname(config.dbPath), { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

// Schema laut docs/architektur-drohnen-spot-bot.md Abschnitt 4, plus zone_cache (Abschnitt 7.1
// / Bot-Anbindung): Cache für DIPUL-Zonenprüfungen, damit wiederholte Anfragen an dieselbe
// (gerundete) Position nicht jedes Mal alle 30 WFS-Layer erneut abfragen. Getrennt von `spots`,
// da ein Cache-Eintrag kein vom Nutzer vorgeschlagener Spot ist.
db.exec(`
  CREATE TABLE IF NOT EXISTS spots (
    id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    original_maps_link TEXT NOT NULL,
    description TEXT,
    suggested_by TEXT NOT NULL,
    discord_message_id TEXT NOT NULL,
    discord_message_link TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    zone_status TEXT NOT NULL,
    zone_names TEXT
  );

  CREATE TABLE IF NOT EXISTS confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spot_id TEXT NOT NULL REFERENCES spots(id),
    name TEXT NOT NULL,
    confirmed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_confirmations_spot ON confirmations(spot_id);

  CREATE TABLE IF NOT EXISTS zone_cache (
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    status TEXT NOT NULL,
    zone_names TEXT NOT NULL,
    checked_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (lat, lng)
  );
`);
