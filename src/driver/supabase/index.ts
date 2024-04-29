import { error, json, jsonList, type RestDriver } from '../../rest/index.js';
import type { Init, ReadContext, RestEnv } from '../../context.js';
import type { ZodSchema } from 'zod';
import type { Context, MiddlewareHandler } from 'hono';
import { createClient, type SupabaseClient, type SupabaseClientOptions } from '../../lib/supabase.js';
import { createFactory, type EndpointConfig } from '../../endpoint.js';
import type { Json } from '../../common.js';

type Ctx = {
  headers: {
    Authorization: string;
    'Content-Type': 'application/json';
  };
  params: Init['params'];
  cookies: {
    SessionToken: string;
  };
};
export type SupabaseCtx = Ctx;

type Env = RestEnv & {
  Variables: Omit<RestEnv['Variables'], 'remote'> & {
    remote: Supabase;
  };
  Bindings: {
    HS_SUPABASE_URL: string;
    HS_SUPABASE_KEY: string;
  };
};
export type SupabaseEnv = Env;

type Cfg = {
  table: string;
  schema: ZodSchema;
};
export type SupabaseCfg = Cfg;

export enum Schema {
  PUBLIC = 'public',
  STORAGE = 'storage',
}

export class Supabase implements RestDriver<Ctx, Env, Cfg> {
  public client: SupabaseClient;

  constructor(context: Context<Env>, options?: SupabaseClientOptions<Schema>) {
    const { HS_SUPABASE_URL, HS_SUPABASE_KEY } = context.env;
    this.client = createClient(HS_SUPABASE_URL, HS_SUPABASE_KEY, options) as never;
  }

  public async getAll<Body extends Json = Json>(
    context: ReadContext<Ctx, Body, Env>,
    config: EndpointConfig<Body, Ctx, Cfg>
  ) {
    const { data, error: err } = await this.client.from(config.table).select('*');

    if (err) {
      return error([
        {
          code: 'internal',
          field: 'database',
          message: err.message ?? 'Internal database error.',
        },
      ]);
    }

    return jsonList<Body>(data ?? [], { total: data?.length ?? 0, limit: data?.length ?? 0, page: 1 });
  }

  public async getOne<Body extends Json = Json>(
    context: ReadContext<Ctx, Body, Env>,
    config: EndpointConfig<Body, Ctx, Cfg>,
    id: string
  ) {
    const { data, error: err } = await this.client.from(config.table).select('*').eq('id', id);

    if (err) {
      return error([
        {
          code: 'internal',
          field: 'database',
          message: err.message ?? 'Internal database error.',
        },
      ]);
    }

    return json<Body>(data?.[0] ?? {});
  }

  public async create<Body extends Json = Json>(
    context: ReadContext<Ctx, Body, Env>,
    config: EndpointConfig<Body, Ctx, Cfg>,
    body: Body
  ) {
    const { data, error: err } = await this.client.from(config.table).insert(body).returns();

    if (err) {
      return error([
        {
          code: 'internal',
          field: 'database',
          message: err.message ?? 'Internal database error.',
        },
      ]);
    }

    return json<Body>((data ?? {}) as never);
  }

  public async update<Body extends Json = Json>(
    context: ReadContext<Ctx, Body, Env>,
    config: EndpointConfig<Body, Ctx, Cfg>,
    id: string,
    body: Body
  ) {
    const { data, error: err } = await this.client.from(config.table).update(body).eq('id', id).returns();

    if (err) {
      return error([
        {
          code: 'internal',
          field: 'database',
          message: err.message ?? 'Internal database error.',
        },
      ]);
    }

    return json<Body>((data ?? {}) as never);
  }

  public async deleteOne<Body extends Json = Json>(
    context: ReadContext<Ctx, Body, Env>,
    config: EndpointConfig<Body, Ctx, Cfg>,
    id: string
  ) {
    const { data, error: err } = await this.client.from(config.table).delete().eq('id', id).returns();

    if (err) {
      return error([
        {
          code: 'internal',
          field: 'database',
          message: err.message ?? 'Internal database error.',
        },
      ]);
    }

    return json<Body>((data ?? {}) as never);
  }
}

export const supabase = (options?: SupabaseClientOptions<Schema>): MiddlewareHandler => {
  return async (c, next) => {
    c.set('remote', new Supabase(c, options));
    await next();
  };
};

export const endpoint = createFactory<Cfg, Env, Ctx>(supabase());
export type Endpoint<Body extends Json = Json, Context extends Ctx = Ctx, Extras extends Cfg = Cfg> = EndpointConfig<
  Body,
  Context,
  Extras
>;
