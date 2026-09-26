import Fastify from 'fastify';
import { config } from './config.js';
import { spotRoutes } from './routes/spots.js';
import { zoneCacheRoutes } from './routes/zoneCache.js';

export function buildApp() {
  const app = Fastify({ logger: true });
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
