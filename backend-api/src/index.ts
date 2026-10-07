import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { spotRoutes } from './routes/spots.js';
import { zoneCacheRoutes } from './routes/zoneCache.js';

export function buildApp() {
  const app = Fastify({ logger: true });
  // Reflektiert jede Origin — unkritisch, solange die API nur intern/lokal erreichbar ist
  // (kein Traefik-Routing, siehe docs/architektur-drohnen-spot-bot.md Abschnitt 9). Vor einer
  // echten öffentlichen Exposition auf konkrete Origins einschränken.
  app.register(cors, { origin: true });
  app.get('/health', async () => ({ ok: true }));
  app.register(spotRoutes);
  app.register(zoneCacheRoutes);
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildApp();
  app.listen({ port: config.port, host: '0.0.0.0' }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
