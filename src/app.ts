import { type Context, Hono, type MiddlewareHandler } from 'hono';
import { type ApiConfig, importRoutes, join } from './resolver.js';
import type { FC } from 'hono/jsx';
import { jsxRenderer } from 'hono/jsx-renderer';
import Main from './docs/Main.js';
import { debugColor, infoColor, logger, primaryColor, warnColor } from './utils';
import type { RestEnv } from './context.js';
import {
  type ClientRoute,
  CrudMethod,
  type FlatRoute,
  HttpMethod,
  load,
  type ServerRoute,
  type Wrapper,
} from './route.js';
import { debugStart } from './common.js';
import type { RouterRoute } from 'hono/types';
import { endpoint } from './endpoint.js';

export function createApp<E extends RestEnv = RestEnv>(...handlers: Array<MiddlewareHandler | ApiConfig>) {
  const config = handlers.find((h) => typeof h === 'object') as ApiConfig;
  const initMiddlewares: MiddlewareHandler[] = [];
  const postMiddlewares: MiddlewareHandler[] = [];

  let current = initMiddlewares;
  for (const mid of handlers) {
    if (typeof mid === 'function') {
      current.push(mid);
    } else {
      current = postMiddlewares;
    }
  }

  const newConfig: ApiConfig = {
    basePath: config?.basePath,
    docsPath: config?.docsPath,
    withDocs: config?.withDocs ?? true,
    routes: {
      client:
        config?.routes?.client ??
        import.meta.glob(`/src/routes/**/+(page|layout).(tsx|mdx)`, {
          eager: true,
        }),
      server:
        config?.routes?.server ??
        import.meta.glob(`/src/routes/**/+server.(tsx|mdx)`, {
          eager: true,
        }),
    },
  };
  const { client = [], server = [] } = importRoutes(newConfig);

  const api = new Hono<E>();
  api.use(async (c, next) => {
    Object.assign(c.env, { ...import.meta.env });

    const base = config?.basePath ?? '/api';
    const apiRoutes = api.routes.filter((r) => r.path.startsWith(base) && !r.path.endsWith('*'));
    c.set('routes', groupRoutes(apiRoutes, newConfig));

    await next();
  });
  api.use(jsxRenderer(({ children }) => Main({ children })));
  api.use(debugStart());

  if (initMiddlewares.length) {
    api.use(...initMiddlewares);
  }

  for (const route of server) {
    registerApi(api, route, newConfig);
  }

  for (const route of client) {
    const subApp = registerApp(route);
    api.route(route.path, subApp);
  }

  if (postMiddlewares.length) {
    api.use(...postMiddlewares);
  }

  return api;
}

function registerApi<E extends RestEnv = RestEnv>(api: Hono<E>, route: ServerRoute, config?: ApiConfig) {
  const { module } = route;
  let main = module.default;

  if (main && typeof main === 'object' && 'name' in main) {
    const route = main as never as ServerRoute;
    main = endpoint(main as never).all();
    console.log(route.schema);
  }

  if (typeof main === 'function') {
    let handler = main as Wrapper;

    if (handler.__type !== 'handler') {
      handler = load(handler as never) as never;
    }

    api.get(route.path, handler as never);
    logger.verbose(`Registered ${infoColor('HOOK')}: GET ${route.path}`);

    for (const method of Object.values(HttpMethod)) {
      if (module[method]) {
        api.on(method, route.path, module[method] as never);
        logger.verbose(`Registered ${infoColor('HTTP')}: ${method} ${route.path}`);
      }
    }

    if (route.children?.length) {
      for (const child of route.children) {
        registerApi(api, child, config);
      }
    }
  } else if (main instanceof Hono) {
    const endpoint = main;
    api.route(route.path, endpoint);

    for (const subRoute of endpoint.routes) {
      if (!subRoute.path.endsWith('*')) {
        logger.verbose(`Registered ${debugColor('REST')}: ${subRoute.method} ${join(route.path, subRoute.path)}`);

        registerDoc<E>(
          api,
          {
            ...route,
            path: join(route.path, subRoute.path),
          },
          config
        );
      }
    }

    if (route.children?.length) {
      const recRoute = api.routes.find((r) => r.path.startsWith(route.path + '/:'));

      for (const child of route.children) {
        registerApi(
          api,
          {
            ...child,
            path: child.path.replace(route.path, recRoute?.path ?? route.path),
          },
          config
        );
      }
    }
  } else {
    const methodMaps = {
      LIST: HttpMethod.GET,
      READ: HttpMethod.GET,
      CREATE: HttpMethod.POST,
      UPDATE: HttpMethod.PATCH,
      DELETE: HttpMethod.DELETE,
      REPLACE: HttpMethod.PUT,
    };

    for (const m of Object.values(CrudMethod)) {
      if (module[m] && methodMaps[m]) {
        api.on(methodMaps[m], route.path, module[m] as never);
        logger.verbose(`Registered ${debugColor('CRUD')}: ${m} ${route.path}`);
        // registerDoc<E>(api, route, config);
      }
    }
  }

  return api;
}

function registerApp(route: ClientRoute, parent?: FC) {
  const { module } = route;
  const app = new Hono();
  app.use(jsxRenderer(({ children }) => (parent ? parent({ children }) : (children as never))));

  if (typeof module?.default === 'function') {
    const renderPage = module.default as FC;

    app.get(route.path, async (c) => {
      if (route.layout) {
        if (typeof route.layout !== 'function') {
          return c.render('');
        }

        return c.render(route.layout({ children: renderPage({}) }));
      } else {
        return c.render(renderPage({}));
      }
    });

    logger.verbose(`Registered ${primaryColor('HTTP')}: GET ${route.path}`);
  }

  if (route.children?.length) {
    for (const child of route.children) {
      const subApp = registerApp(
        {
          ...child,
          path: child.path.replace(route.path, ''),
        },
        route.layout
      );
      app.route('/', subApp);
    }
  }

  return app;
}

export function registerDoc<E extends RestEnv = RestEnv>(api: Hono<E>, route: ServerRoute, config?: ApiConfig) {
  if (config?.withDocs) {
    const docPath = route.path.replace(config?.basePath ?? '/api', config?.docsPath ?? '');
    api.get(docPath, docRoute(route));
    logger.verbose(`Registered ${warnColor('DOCS')}: GET ${docPath || '/'}`);
  }
}

export function docRoute(route: ServerRoute) {
  return async (c: Context) => {
    if (route.page) {
      return c.render((route.page as FC)({}));
    }

    return c.render('');
  };
}

function groupRoutes(routes: RouterRoute[], config?: ApiConfig) {
  const group: {
    [key: string]: FlatRoute;
  } = {};

  for (const route of routes) {
    if (!group[route.path]) {
      group[route.path] = {
        name: route.path.replace(config?.basePath ?? '/api', '') || '/',
        path: route.path,
        methods: [],
        children: [],
      };
    }

    group[route.path]?.methods?.push(route.method);
  }

  const mappedGroup = Object.entries(group).map(([, value]) => value);
  return regroupRoutes(mappedGroup);
}

function regroupRoutes(routes: FlatRoute[], config?: ApiConfig) {
  for (const route of routes) {
    const children = routes.filter((r) => r.path.startsWith(route.path) && r.path !== route.path);
    if (children.length) {
      route.children = children;

      for (const child of children) {
        routes.splice(routes.indexOf(child), 1);
      }

      regroupRoutes(route.children, config);
    }
  }

  return routes;
}
