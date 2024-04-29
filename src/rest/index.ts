import type { Init, ReadContext, RestEnv, WriteContext } from '../context.js';
import { type APIError, type Json, type Listing, type RestResponse } from '../common.js';
import type { EndpointConfig } from '../endpoint.js';
import type { RouterConfig } from '../route.js';
import type { StatusCode } from 'hono/utils/http-status';

export abstract class RestDriver<Ctx extends Init = Init, Env extends RestEnv = RestEnv, Xtr extends Json = Json> {
  abstract get?(c: ReadContext<Ctx, Json, Env>, o: RouterConfig<Xtr>): Promise<RestResponse>;

  abstract post?(c: WriteContext<Ctx, Json, Env>, o: RouterConfig<Xtr>): Promise<RestResponse>;

  abstract put?(c: WriteContext<Ctx, Json, Env>, o: RouterConfig<Xtr>): Promise<RestResponse>;

  abstract patch?(c: WriteContext<Ctx, Json, Env>, o: RouterConfig<Xtr>): Promise<RestResponse>;

  abstract delete?(c: ReadContext<Ctx, Json, Env>, o: RouterConfig<Xtr>): Promise<RestResponse>;

  abstract getAll?(c: ReadContext<Ctx, Json, Env>, o: EndpointConfig<Json, Ctx, Xtr>): Promise<RestResponse>;

  abstract getOne?(
    c: ReadContext<Ctx, Json, Env>,
    o: EndpointConfig<Json, Ctx, Xtr>,
    id: string
  ): Promise<RestResponse>;

  abstract create?(
    c: WriteContext<Ctx, Json, Env>,
    o: EndpointConfig<Json, Ctx, Xtr>,
    body: Json
  ): Promise<RestResponse>;

  abstract update?(
    c: WriteContext<Ctx, Json, Env>,
    o: EndpointConfig<Json, Ctx, Xtr>,
    id: string,
    body: Json
  ): Promise<RestResponse>;

  abstract replace?(
    c: WriteContext<Ctx, Json, Env>,
    o: EndpointConfig<Json, Ctx, Xtr>,
    id: string,
    body: Json
  ): Promise<RestResponse>;

  abstract deleteOne?(
    c: ReadContext<Ctx, Json, Env>,
    o: EndpointConfig<Json, Ctx, Xtr>,
    id: string
  ): Promise<RestResponse>;
}

export function json<T extends Json = Json>(body: T, status: StatusCode = 200): RestResponse {
  return {
    ok: true,
    status,
    body,
  };
}

export function jsonList<T extends Json = Json>(
  data: T[],
  meta: Listing['meta'],
  status: StatusCode = 200
): RestResponse<Listing<T>> {
  return {
    ok: true,
    status,
    body: { data, meta },
    multiple: true,
  };
}

export function notFound(field?: string): RestResponse {
  return {
    ok: false,
    status: 404,
    body: {
      errors: [
        {
          code: 'not-found',
          field: field ?? 'unknown',
          message: 'Not found',
        },
      ],
    },
  };
}

export function badRequest(errors?: APIError[]): RestResponse {
  return {
    ok: false,
    status: 400,
    body: {
      errors: errors ?? [],
    },
  };
}

export function unauthorized(errors?: APIError[]): RestResponse {
  return {
    ok: false,
    status: 401,
    body: {
      errors: errors ?? [],
    },
  };
}

export function forbidden(errors?: APIError[]): RestResponse {
  return {
    ok: false,
    status: 403,
    body: {
      errors: errors ?? [],
    },
  };
}

export function error(errors?: APIError[], status: StatusCode = 500): RestResponse {
  return {
    ok: false,
    status,
    statusText: 'Internal error',
    body: { errors },
  };
}
