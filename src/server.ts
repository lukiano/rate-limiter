import * as Koa from 'koa';
import { once } from 'events';
import { createServer } from 'http';
import { promisify } from 'util';

import { injectRateLimiter, RateLimiterKoa, rateLimiterMiddleware } from './rateLimiterKoa';

export interface Closeable {
  close(): Promise<void>
}

export async function startServer(port: number): Promise<Closeable> {
  const app: RateLimiterKoa = new Koa();

  injectRateLimiter(app);
  app.use(rateLimiterMiddleware);

  app.use(async (ctx) => {
    ctx.body = 'success';
  });
  const server = createServer(app.callback());
  server.listen(port);
  await once(server, 'listening');
  console.log(`Starting server on port ${port}`);
  return {
    close: () => promisify(server.close).bind(server)()
  }
}

if (require.main === module) {
  startServer(3000).catch((err) => console.error(err));
}
