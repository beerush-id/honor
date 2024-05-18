import { Hono, type MiddlewareHandler } from 'hono';
import { isFunction, isObject } from '@beerush/utilities';
import type { RestEnv } from './types.js';
import { createReadContext } from './context.js';
import { parseBody } from 'hono/utils/body';
import { appendTrailingSlash, trimTrailingSlash } from 'hono/trailing-slash';

export type AppConfig = {
  basePath: string;
  docsPath?: string;
  trailingSlash?: boolean;
  routes: {
    client: Record<string, unknown>[];
    server: Record<string, unknown>[];
  };
};

export function createApp<E extends RestEnv = RestEnv>(...inits: Array<AppConfig | MiddlewareHandler>): Hono<E> {
  const config = inits.find((item) => isObject(item)) as AppConfig;
  const middlewares = inits.filter((item) => isFunction(item)) as MiddlewareHandler[];

  // Set default options.
  const options: AppConfig = {
    basePath: config?.basePath ?? '/api',
    docsPath: config?.docsPath ?? '/docs',
    trailingSlash: config?.trailingSlash,
    routes: {
      client:
        config?.routes?.client ??
        import.meta.glob(`/src/routes/**/+*(page.ts|page.md|layout.ts)x`, {
          eager: true,
        }),
      server:
        config?.routes?.server ??
        import.meta.glob(`/src/routes/**/+*(server|schema).(ts|mdx)`, {
          eager: true,
        }),
    },
  };

  // Create a new Hono instance.
  const app = new Hono<E>();

  // Handle trailing slash.
  app.use(options.trailingSlash ? appendTrailingSlash() : trimTrailingSlash());

  // Apply middlewares.
  if (middlewares.length) {
    app.use(...middlewares);
  }

  // Add context to the request.
  app.use(async (c, next) => {
    const context = createReadContext(c);

    if (['post', 'put', 'patch'].includes(c.req.method.toLowerCase())) {
      const headers = context.headers;
      const contentType = headers.get('Content-Type');

      if (contentType?.includes('application/json')) {
        try {
          const body = await parseBody(c.req);
          Object.assign(context, { body });
        } catch (e) {
          // ignore
        }
      } else if (
        contentType?.includes('application/x-www-form-urlencoded') ||
        contentType?.includes('multipart/form-data')
      ) {
        try {
          const body = await c.req.parseBody();
          Object.assign(context, { body });
        } catch (e) {
          // ignore
        }
      } else {
        try {
          const body = await c.req.text();
          Object.assign(context, { body });
        } catch (e) {
          // ignore
        }
      }
    }

    c.set('context' as never, context as never);

    await next();
  });

  const server = loadServerRoutes(options.routes.server);
  const client = loadClientRoutes(options.routes.client);

  app.route(options.basePath, server);
  app.route('/', client);

  return app;
}

function loadServerRoutes(routes: Record<string, unknown>[]) {
  const server = new Hono();

  return server;
}

function loadClientRoutes(routes: Record<string, unknown>[]) {
  const client = new Hono();

  return client;
}
