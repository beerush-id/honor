import { type Cookie, createCookie } from './lib';
import type { Context as RouteContext } from 'hono';
import { type Fields } from './entity.js';
import type { NestedPath } from './utils';
import type { RestDriver } from './rest';
import { parseBody } from 'hono/utils/body';
import type { ZodSchema } from 'zod';
import type { FlatRoute } from './route.js';
import type { Flat, Json } from './common';

export type Init = {
  headers: Flat;
  cookies: Flat;
  params: Json;
};

export type Filter<T> = {
  sort?: NestedPath<T>[];
  where?: Record<string, unknown>;
  limit?: number;
  page?: number;
};

export type RestEnv<C extends Init = Init> = {
  Variables: {
    routes: FlatRoute[];
    remote: RestDriver<C>;
    startTime: number;
  };
  Bindings: {
    HS_API_SECRET: string;
  };
};

export type ReadContext<ReqInit extends Init = Init, Body extends Json = Json, Env extends RestEnv = RestEnv> = {
  cookie: Cookie<ReqInit['cookies']>;
  event: RouteContext<Env>;
  filter?: Filter<Body>;
  get: RouteContext<Env>['get'];
  headers: RequestHeader<ReqInit['headers']>;
  params: ReqInit['params'];
  request: RouteContext<Env>['req'];
  search: URLSearchParams;
  select?: Fields<Body>;
  include?: Fields<Body>;
  schema?: ZodSchema;
  set: RouteContext<Env>['set'];
  url: URL;
};

export function createContext<ReqInit extends Init, Body extends Json = Json, Env extends RestEnv = RestEnv>(
  event: RouteContext<Env>,
  schema?: ZodSchema
): ReadContext<ReqInit, Body, Env> {
  const url = new URL(event.req.url);
  const context = {
    cookie: createCookie(event, { secret: event.env.HS_API_SECRET }),
    event,
    params: event.req.param(),
    request: event.req,
    search: url.searchParams,
    headers: new RequestHeader(event.req.header()),
    schema,
    url,
    get: event.get,
    set: event.set,
  } as ReadContext<ReqInit, Body, Env>;

  if (url.searchParams.has('filter')) {
    try {
      context.filter = JSON.parse(url.searchParams.get('filter')!);
    } catch (err) {
      // ignore
    }
  }

  if (url.searchParams.has('select')) {
    try {
      context.select = JSON.parse(url.searchParams.get('select')!);
    } catch (err) {
      // ignore
    }
  }

  return context as ReadContext<ReqInit, Body, Env>;
}

export async function createWriteContext<ReqInit extends Init, Body extends Json = Json, Env extends RestEnv = RestEnv>(
  event: RouteContext<Env>,
  schema?: ZodSchema
): Promise<WriteContext<ReqInit, Body, Env>> {
  let body: unknown;

  try {
    body = await event.req.json();
  } catch (err) {
    body = ((await parseBody(event.req)) as never) ?? {};
  }

  const context = createContext(event, schema);
  Object.assign(context, { body });

  return context as WriteContext<ReqInit, Body, Env>;
}

export type WriteContext<
  ReqInit extends Init = Init,
  Body extends Json = Json,
  Env extends RestEnv = RestEnv,
  Payload extends Json = Json,
> = ReadContext<ReqInit, Body, Env> & {
  body: Payload;
};

export type FormContext<
  Context extends Init = Init,
  Body extends Json = Json,
  Env extends RestEnv = RestEnv,
  Payload extends FormData = FormData,
> = ReadContext<Context, Body, Env> & {
  body: Payload;
};

class RequestHeader<T extends Flat> extends Headers {
  get(name: keyof T) {
    return super.get(name as never);
  }

  set(name: keyof T, value: T[keyof T]) {
    return super.set(name as never, value);
  }

  has(name: keyof T) {
    return super.has(name as never);
  }

  delete(name: keyof T) {
    return super.delete(name as never);
  }
}
