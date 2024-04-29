import type { ZodSchema } from 'zod';
import { z } from '@hono/zod-openapi';
import {
  createContext,
  createWriteContext,
  type Init,
  type ReadContext,
  type RestEnv,
  type WriteContext,
} from './context';
import { debugEnd, error, type Json, respond, type RestResponse } from './common.js';
import { type Context, type TypedResponse } from 'hono';
import type { RestDriver } from './rest';
import type { FC } from 'hono/jsx';
import { select, selectAll } from './entity.js';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum CrudMethod {
  LIST = 'LIST',
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  REPLACE = 'REPLACE',
}

export type FlatRoute = {
  name: string;
  path: string;
  methods: string[];
  children: FlatRoute[];
};
export type RouteModule = {
  default: unknown;
} & {
  [K in CrudMethod]: unknown;
} & {
  [K in HttpMethod]: unknown;
};

export type RouteInit = {
  path: string;
  module: RouteModule;
  children: RouteInit[];
};
export type ClientRoute = RouteInit & {
  layout?: FC;
};
export type ServerRoute = RouteInit & {
  page?: FC;
  schema?: ZodSchema;
};

export type BaseConfig<T> = {
  name: string;
  schema?: ZodSchema;
  identifier?: string;
  title?: string;
  description?: string;
} & (T extends Json ? { [K in keyof T]: T[K] } : never);

export type BeforeHook<T> = (c: T) => Promise<void>;
export type AfterHook<T, R extends Json = Json> = (c: T, response: RestResponse<R>) => Promise<void>;
export type RouterHooks<Res extends Json = Json, Ctx extends Init = Init> = {
  beforeGet?: BeforeHook<ReadContext<Ctx, Res>>;
  afterGet?: AfterHook<ReadContext<Ctx, Res>, Res>;
  beforePost?: BeforeHook<WriteContext<Ctx, Res>>;
  afterPost?: AfterHook<WriteContext<Ctx, Res>, Res>;
  beforePut?: BeforeHook<WriteContext<Ctx, Res>>;
  afterPut?: AfterHook<WriteContext<Ctx, Res>, Res>;
  beforePatch?: BeforeHook<WriteContext<Ctx, Res>>;
  afterPatch?: AfterHook<WriteContext<Ctx, Res>, Res>;
  beforeDelete?: BeforeHook<ReadContext<Ctx, Res>>;
  afterDelete?: AfterHook<ReadContext<Ctx, Res>, Res>;
};

export type RouterConfig<
  Res extends Json = Json,
  Ctx extends Init = Init,
  Xtr extends Json = Json,
> = BaseConfig<Xtr> & {
  methods?: HttpMethod[];
  hooks?: RouterHooks<Res, Ctx>;
};

export type Wrapper = (<Rec extends Json = Json, Env extends RestEnv = RestEnv>(c: Context<Env>) => Promise<Rec>) & {
  __type: string;
};

export type ReadHandler<C extends Init = Init, T extends Json = Json, E extends RestEnv = RestEnv> = (
  c: ReadContext<C, T, E>
) => Promise<Json>;

export function load<Ctx extends Init = Init, Rec extends Json = Json, Env extends RestEnv = RestEnv>(
  fn: ReadHandler<Ctx, Rec, Env>
) {
  const handler = async (c: Context<Env>) => {
    const context = createContext<Ctx, Rec, Env>(c);
    return await handleReq(c, context as never, fn as never);
  };

  Object.assign(handler, { __type: 'handler' });

  return handler;
}

export type WriteHandler<Ctx extends Init = Init, Rec extends Json = Json, Env extends RestEnv = RestEnv> = (
  c: WriteContext<Ctx, Rec, Env>
) => Promise<Json> | Json;

export function write<Ctx extends Init = Init, Rec extends Json = Json, Env extends RestEnv = RestEnv>(
  fn: WriteHandler<Ctx, Rec, Env>
) {
  const handler = async (c: Context<Env>) => {
    const context = await createWriteContext<Ctx, Rec, Env>(c);
    return await handleReq(c, context as never, fn as never);
  };

  Object.assign(handler, { __type: 'handler' });

  return handler;
}

async function handleReq(request: Context, context: ReadContext, handle: ReadHandler) {
  try {
    const response = await handle(context);

    if (typeof response === 'object') {
      if (context.select) {
        if (Array.isArray(response)) {
          return request.json(selectAll(response as never, context.select as never));
        } else {
          return request.json(select(response as never, context.select as never));
        }
      }

      debugEnd(request);
      return request.json(response);
    }

    debugEnd(request);
    return request.body(response as never);
  } catch (err) {
    debugEnd(request);

    return error(err as Error, [
      {
        code: 'internal',
        message: (err as Error)?.message,
      },
    ]);
  }
}

export const beforeReq = async <Ctx extends Init = Init, Rec extends Json = Json, Env extends RestEnv = RestEnv>(
  c: ReadContext<Ctx, Rec, Env>,
  handle?: BeforeHook<ReadContext<Ctx, Rec, Env>>
) => {
  if (typeof handle === 'function') {
    await handle(c);
  }

  return {
    method: c.event.req.method.toLowerCase(),
    remote: c.event?.get('remote') as RestDriver,
  };
};

export const beforeWrite = async <
  Ctx extends Init = Init,
  Rec extends Json = Json,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(
  c: WriteContext<Ctx, Rec, Env>,
  config: BaseConfig<Xtr>
) => {
  if (config.schema) {
    const validation = config.schema?.safeParse(c.body);

    if (!validation?.success) {
      return {
        ok: false,
        status: 400,
        statusText: 'Validation error',
        body: {
          errors: validation.error.errors,
        },
      } as RestResponse;
    }
  }

  return { ok: true } as RestResponse;
};

export const afterRead = async <
  Ctx extends Init = Init,
  Rec extends Json = Json,
  Env extends RestEnv = RestEnv,
  P extends boolean = false,
>(
  c: ReadContext<Ctx, Rec, Env>,
  config: BaseConfig<Json>,
  response: RestResponse<Rec>,
  handle?: AfterHook<ReadContext<Ctx, Rec, Env>>,
  plain?: P
): Promise<P extends true ? RestResponse : TypedResponse> => {
  if (typeof handle === 'function') {
    await handle(c as never, response);
  }

  if (config.schema && response.ok && response.body) {
    let validation;

    if (response.multiple && Array.isArray(response.body.data)) {
      validation = z
        .object({
          data: z.array(config.schema),
          meta: z.object({
            total: z.number().optional(),
            limit: z.number().optional(),
            offset: z.number().optional(),
          }),
        })
        .safeParse(response.body);
    } else {
      validation = config.schema?.safeParse(response.body);
    }

    if (!validation?.success) {
      const error = {
        ok: false,
        status: 400,
        statusText: 'Invalid response',
        body: {
          errors: validation.error.errors,
          message: 'Response validation failed',
          status: 400,
        },
      } as RestResponse;

      debugEnd(c.event);
      return (plain ? error : respond(c.event, error)) as never;
    }
  }

  debugEnd(c.event);
  return (plain ? response : respond(c.event, response)) as never;
};

export function afterWrite<
  Ctx extends Init = Init,
  Rec extends Json = Json,
  Env extends RestEnv = RestEnv,
  P extends boolean = false,
>(
  c: WriteContext<Ctx, Rec, Env>,
  config: BaseConfig<Json>,
  response: RestResponse<Rec>,
  handle?: AfterHook<WriteContext<Ctx, Rec, Env>>,
  plain?: P
): Promise<P extends true ? RestResponse : TypedResponse> {
  return afterRead(c, config, response, handle as never, plain);
}
