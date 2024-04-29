import type { FC } from 'hono/jsx';
import { type ClientRoute, type RouteInit, type ServerRoute } from './route.js';

export type ApiConfig = {
  basePath?: string;
  docsPath?: string;
  withDocs?: boolean;
  routes?: RoutePaths;
};

export type RoutePaths = {
  client: Record<string, unknown>;
  server: Record<string, unknown>;
};

export function importRoutes(config?: ApiConfig) {
  if (config?.routes) {
    return {
      client: mapFeRoutes(config.routes.client) as ClientRoute[],
      server: mapBeRoutes(config.routes.server, config) as ServerRoute[],
    };
  }

  return { client: [], server: [] };
}

const mapFeRoutes = (routes: Record<string, unknown>) => {
  const mappedRoutes: ClientRoute[] = [];
  const layoutMaps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(routes)) {
    if (key.includes('/+layout')) {
      layoutMaps[key] = value;
      delete routes[key];
    }
  }

  for (const [key, value] of Object.entries(routes)) {
    const path = key.replace('/src/routes/', '/').replace(/\[([^\]]+)\]/g, ':$1');
    const [base] = path.split('/+');

    const route = {
      path: base || '/',
      module: value as never,
      children: [],
    } as ClientRoute;

    const layoutKey = key.replace('+page.tsx', '+layout.tsx').replace('+page.mdx', '+layout.tsx');
    if (layoutMaps[layoutKey]) {
      route.layout = (layoutMaps[layoutKey] as { default: FC }).default as FC;
    }

    mappedRoutes.push(route);
  }

  remapRoutes(mappedRoutes);
  return mappedRoutes;
};

const mapBeRoutes = (routes: Record<string, unknown>, config?: ApiConfig) => {
  const mappedRoutes: ServerRoute[] = [];
  const docsMaps: Record<string, unknown> = {};
  const schemaMaps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(routes)) {
    if (key.includes('+server.mdx')) {
      docsMaps[key] = value;
      delete routes[key];
    }

    if (key.includes('+schema.ts')) {
      schemaMaps[key] = value;
      delete routes[key];
    }
  }

  for (const [key, value] of Object.entries(routes)) {
    const path = key.replace('/src/routes/', '/').replace(/\[([^\]]+)\]/g, ':$1');
    const [base] = path.split('/+');

    const route = {
      path: base || '/',
      module: value as never,
      children: [],
    } as ServerRoute;

    const docsKey = key.replace('+server.ts', '+server.mdx').replace('+server.tsx', '+server.mdx');
    if (docsMaps[docsKey]) {
      route.page = (docsMaps[docsKey] as { default: FC }).default as FC;
    }

    const schemaKey = key.replace('+server.ts', '+schema.ts').replace('+server.tsx', '+schema.ts');
    if (schemaMaps[schemaKey]) {
      route.schema = (schemaMaps[schemaKey] as { default: Record<string, unknown> }).default as never;
    }

    mappedRoutes.push(route);
  }

  remapRoutes(mappedRoutes, config);
  return mappedRoutes;
};

const remapRoutes = (routes: RouteInit[], config?: ApiConfig) => {
  for (const route of routes) {
    const children = routes.filter((r) => r.path.startsWith(route.path) && r.path !== route.path);

    if (children.length) {
      route.children = children;

      for (const child of children) {
        routes.splice(routes.indexOf(child), 1);
      }

      remapRoutes(route.children, config);
    }
  }

  if (config?.basePath) {
    for (const route of routes) {
      route.path = join(config.basePath, route.path).replace(/\/$/, '');
    }
  }

  return routes;
};

export const join = (...paths: string[]) => {
  return paths.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
};
