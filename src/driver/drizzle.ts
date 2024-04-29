import { json, jsonList, notFound, type RestDriver } from '../rest';
import type { Init, ReadContext, RestEnv } from '../context.js';
import type { ZodSchema } from 'zod';
import type { Context, MiddlewareHandler } from 'hono';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type Json, type RestResponse } from '../common.js';
import { createFactory, type EndpointConfig, type ReadHook, type WriteHook } from '../endpoint.js';
import { PgTable, pgTable, uuid } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export type Ctx = {
  headers: {
    Authorization: string;
    'Content-Type': 'application/json';
  };
  params: Init['params'];
  cookies: {
    SessionToken: string;
  };
};

type Env = RestEnv & {
  Variables: {
    remote: Drizzle;
    schema: ZodSchema;
    table: TableInit;
  };
  Bindings: {
    HS_DATABASE_URL: string;
  };
};
export type DrizzleEnv = Env;

export type Cfg = {
  table: PgTable;
};

const tmp = pgTable('tmp', {
  id: uuid('id').primaryKey(),
});
type TableInit = typeof tmp;

export class Drizzle implements RestDriver<Ctx, Env, Cfg> {
  public db: PostgresJsDatabase<{
    tmp: TableInit;
  }>;

  constructor(c: Context<Env>) {
    const client = postgres(c.env.HS_DATABASE_URL, { prepare: false });
    this.db = drizzle(client);
  }

  public async getOne(
    context: ReadContext<Ctx, Json, Env>,
    config: EndpointConfig<Json, Ctx, Cfg>,
    id: string
  ): Promise<RestResponse> {
    const table = config.table as TableInit;
    const result = await this.db.select().from(table).where(eq(table.id, id));

    if (result.length) {
      return json(result[0]);
    }

    return notFound(id);
  }

  public async getAll(context: ReadContext<Ctx, Json, Env>, config: EndpointConfig<Json, Ctx, Cfg>) {
    const result = await this.db.select().from(config.table);

    if (result.length) {
      return jsonList(result, { total: result.length, limit: result.length, page: 1 });
    }

    return jsonList([], { total: 0, limit: 0, page: 0 });
  }

  public async create(context: ReadContext<Ctx, Json, Env>, config: EndpointConfig<Json, Ctx, Cfg>, body: Json) {
    const table = config.table as TableInit;
    const result = await this.db
      .insert(table)
      .values(body as never)
      .onConflictDoUpdate({
        target: table.id,
        set: body as never,
      })
      .returning();

    return json(result.length === 1 ? result[0] : (result as never));
  }

  public async update(
    context: ReadContext<Ctx, Json, Env>,
    config: EndpointConfig<Json, Ctx, Cfg>,
    id: string,
    body: Json
  ) {
    const table = config.table as TableInit;
    const result = await this.db
      .update(table)
      .set(body as never)
      .where(eq(table.id, id))
      .returning();

    return json(result.length === 1 ? result[0] : (result as never));
  }

  public async deleteOne(context: ReadContext<Ctx, Json, Env>, config: EndpointConfig<Json, Ctx, Cfg>, id: string) {
    const table = config.table as TableInit;
    const result = await this.db.delete(table).where(eq(table.id, id)).returning();

    return json(result.length === 1 ? result[0] : (result as never));
  }
}

export function useDribble(): MiddlewareHandler {
  return async (c: Context<Env>, next) => {
    const remote = new Drizzle(c);
    c.set('remote', remote as never);

    await next();
  };
}

export function useReader<Body extends Json = Json>(): ReadHook<Body, Ctx, Env, Cfg> {
  return (ctx, cfg) => {
    ctx.schema = createSelectSchema(cfg.table);
  };
}

export function useWriter<Body extends Json = Json>(): WriteHook<Body, Ctx, Env, Cfg> {
  return (ctx, cfg) => {
    ctx.schema = createInsertSchema(cfg.table);
  };
}

export const endpoint = createFactory<Cfg, Env, Ctx>(useDribble());
export type Endpoint<Body extends Json = Json, Context extends Ctx = Ctx, Extras extends Cfg = Cfg> = EndpointConfig<
  Body,
  Context,
  Extras
>;
