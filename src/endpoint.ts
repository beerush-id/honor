import { type Context, Hono, type MiddlewareHandler } from 'hono';
import {
  createContext,
  createWriteContext,
  type Init,
  type ReadContext,
  type RestEnv,
  type WriteContext,
} from './context.js';
import { error, type Json, type Listing, respond, type RestResponse } from './common.js';
import {
  type AfterHook,
  afterRead,
  afterWrite,
  type BaseConfig,
  type BeforeHook,
  beforeReq,
  beforeWrite,
  CrudMethod,
  HttpMethod,
  type RouterHooks,
} from './route.js';
import { logger } from './utils/logger.js';
import { jsxRenderer } from 'hono/jsx-renderer';
import Main from './docs/Main.js';
import { error as restError, type RestDriver } from './rest';

export type EndpointConfig<
  Body extends Json = Json,
  Context extends Init = Init,
  Extras extends Json = Json,
> = BaseConfig<Extras> & {
  name: string;
  primaryKey?: string;
  methods?: CrudMethod[];
  hooks?: EndpointHooks<Body, Context>;
};

export type EndpointHooks<Res extends Json = Json, Ctx extends Init = Init> = RouterHooks<Res, Ctx> & {
  beforeList?: AfterHook<ReadContext<Ctx, Res>>;
  afterList?: AfterHook<ReadContext<Ctx, Res>, Listing<Res>>;
  beforeGet?: BeforeHook<ReadContext<Ctx, Res>>;
  afterGet?: AfterHook<ReadContext<Ctx>, Res>;
  beforeCreate?: BeforeHook<WriteContext<Ctx, Res>>;
  afterCreate?: AfterHook<WriteContext<Ctx, Res>, Res>;
  beforeUpdate?: BeforeHook<WriteContext<Ctx, Partial<Res>>>;
  afterUpdate?: AfterHook<WriteContext<Ctx, Res>, Res>;
  beforeDelete?: BeforeHook<ReadContext<Ctx, Res>>;
  afterDelete?: AfterHook<ReadContext<Ctx, Res>, Res>;
};

export type ReadHook<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
> = (
  ctx: ReadContext<Ctx, Rec, Env>,
  cfg: EndpointConfig<Rec, Ctx, Xtr>
) => (void | Promise<void>) | (Response | Promise<Response>);

export type ReadHooks<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
> = Array<ReadHook<Rec, Ctx, Env, Xtr> | EndpointConfig<Rec, Ctx, Xtr>>;

export type WriteHook<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
> = (
  ctx: WriteContext<Ctx, Rec, Env>,
  cfg: EndpointConfig<Rec, Ctx, Xtr>
) => (void | Promise<void>) | (Response | Promise<Response>);

export type WriteHooks<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
> = Array<WriteHook<Rec, Ctx, Env, Xtr> | EndpointConfig<Rec, Ctx, Xtr>>;

export function endpoint<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...handlers: Array<MiddlewareHandler<Env> | EndpointConfig<Rec, Ctx, Xtr>>) {
  const config = handlers.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = handlers.filter((h) => typeof h === 'function') as MiddlewareHandler[];

  const app = new Hono<Env>();
  app.use(jsxRenderer(({ children }) => Main({ children })));

  if (Array.isArray(middleware) && middleware.length) {
    app.use(...middleware);
  }

  const getAll = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: ReadHook<R, C, E, X>[]
  ): Hono<E> => {
    app.get('/', list(...[...hooks, config as never]));
    return app as never;
  };
  const createOne = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: WriteHook<R, C, E, X>[]
  ): Hono<E> => {
    app.post('/', create(...[...hooks, config as never]));
    return app as never;
  };
  const getOne = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: ReadHook<R, C, E, X>[]
  ): Hono<E> => {
    app.get(`/:${config.name}_id`, read(...[...hooks, config as never]));
    return app as never;
  };
  const updateOne = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: WriteHook<R, C, E, X>[]
  ): Hono<E> => {
    app.patch(`/:${config.name}_id`, update(...[...hooks, config as never]));
    return app as never;
  };
  const replaceOne = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: WriteHook<R, C, E, X>[]
  ): Hono<E> => {
    app.put(`/:${config.name}_id`, replace(...[...hooks, config as never]));
    return app as never;
  };
  const deleteOne = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: ReadHook<R, C, E, X>[]
  ): Hono<E> => {
    app.delete(`/:${config.name}_id`, remove(...[...hooks, config as never]));
    return app as never;
  };
  const all = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    ...hooks: ReadHook<R, C, E, X>[]
  ): Hono<E> => {
    getAll(...[...hooks, config as never]);
    createOne(...[...hooks, config as never]);
    getOne(...[...hooks, config as never]);
    updateOne(...[...hooks, config as never]);
    replaceOne(...[...hooks, config as never]);
    deleteOne(...[...hooks, config as never]);

    return app as never;
  };
  const only = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    methods: CrudMethod[],
    ...handlers: ReadHook<R, C, E, X>[]
  ): Hono<E> => {
    for (const method of methods) {
      switch (method) {
        case CrudMethod.LIST:
          app.get('/', list(...[...handlers, config as never]));
          break;
        case CrudMethod.CREATE:
          app.post('/', create(...[...handlers, config as never]));
          break;
        case CrudMethod.READ:
          app.get('/', read(...[...handlers, config as never]));
          break;
        case CrudMethod.UPDATE:
          app.patch('/', update(...[...handlers, config as never]));
          break;
        case CrudMethod.REPLACE:
          app.put('/', replace(...[...handlers, config as never]));
          break;
        case CrudMethod.DELETE:
          app.delete('/', remove(...[...handlers, config as never]));
          break;
        default:
          break;
      }
    }

    return app as never;
  };

  const http = <R extends Rec = Rec, C extends Ctx = Ctx, E extends Env = Env, X extends Xtr = Xtr>(
    methods: HttpMethod[],
    ...handlers: WriteHook<R, C, E, X>[]
  ): Hono<E> => {
    for (const method of methods) {
      app.on(method.toLowerCase(), '/', handle(...[...handlers, config as never]));
    }

    return app as never;
  };

  return {
    all,
    only,
    http,
    create: createOne,
    delete: deleteOne,
    list: getAll,
    read: getOne,
    replace: replaceOne,
    update: updateOne,
  };
}

export function createFactory<X extends Json = Json, E extends RestEnv = RestEnv, C extends Init = Init>(
  ...middleware: MiddlewareHandler<E>[]
) {
  return <Rec extends Json = Json, Ctx extends C = C, Env extends E = E, Xtr extends X = X>(
    ...handlers: Array<MiddlewareHandler<Env> | EndpointConfig<Rec, Ctx, Xtr>>
  ) => endpoint<Rec, Ctx, Env, Xtr>(...(middleware as never[]), ...(handlers as never[]));
}

export function handle<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: WriteHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as ReadHook<Rec, Ctx, Env>[];

  return async (event: Context<Env>) => {
    logger.debug(`${event.req.method}: ${event.req.url}`);
    const method = event.req.method.toLowerCase();

    let before;
    let after;
    let contextMaker = createWriteContext;

    switch (method) {
      case 'get':
        before = config?.hooks?.beforeGet;
        after = config?.hooks?.afterGet;
        contextMaker = createContext as never;
        break;
      case 'post':
        before = config?.hooks?.beforePost;
        after = config?.hooks?.afterPost;
        break;
      case 'patch':
        before = config?.hooks?.beforePatch;
        after = config?.hooks?.afterPatch;
        break;
      case 'put':
        before = config?.hooks?.beforePut;
        after = config?.hooks?.afterPut;
        break;
      case 'delete':
        before = config?.hooks?.beforeDelete;
        after = config?.hooks?.afterDelete;
        contextMaker = createContext as never;
        break;
      default:
        break;
    }

    const context = await contextMaker<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context as never, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq<Ctx, Rec, Env>(context as never, before as never);

    const rejected = ensureMethod(remote, method as never);
    if (rejected) {
      return respond(event, rejected);
    }

    if (['post', 'put', 'patch'].includes(method)) {
      const validation = await beforeWrite<Ctx, Rec, Env>(context as never, config);
      if (!validation.ok) {
        return respond(event, validation);
      }
    }

    try {
      const response = await (remote as { [key: string]: (...args: unknown[]) => unknown })[method]?.(
        context as never,
        config as never
      );
      return afterRead(context as never, config, response as never, after as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function list<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: ReadHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as ReadHook<Rec, Ctx, Env>[];
  const { beforeList, afterList } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.LIST}: ${event.req.url}`);

    const context = createContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq<Ctx, Rec, Env>(context, beforeList as never);

    const rejected = ensureMethod(remote, 'getAll');
    if (rejected) {
      return respond(event, rejected);
    }

    try {
      const response = await remote.getAll?.(context as never, config as never);
      return afterRead(context, config, response as never, afterList as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function create<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: WriteHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as WriteHook<Rec, Ctx, Env>[];
  const { beforeCreate, afterCreate } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.CREATE}: ${event.req.url}`);

    const context = await createWriteContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq(context as never, beforeCreate as never);

    const rejected = ensureMethod(remote, 'create');
    if (rejected) {
      return respond(event, rejected);
    }

    const validation = await beforeWrite<Ctx, Rec, Env>(context, config);
    if (!validation.ok) {
      return respond(event, validation);
    }

    try {
      const response = await remote.create?.(context as never, config as never, context.body as never);
      return afterWrite(context as never, config, response as never, afterCreate as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function read<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: ReadHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as ReadHook<Rec, Ctx, Env>[];
  const { beforeGet, afterGet } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.READ}: ${event.req.url}`);

    const context = createContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq(context as never, beforeGet as never);

    const rejected = ensureMethod(remote, 'getOne');
    if (rejected) {
      return respond(event, rejected);
    }

    try {
      const response = await remote.getOne?.(
        context as never,
        config as never,
        context.params[`${config.name}_id`] as never
      );
      return afterRead(context, config, response as never, afterGet as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function update<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: WriteHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as WriteHook<Rec, Ctx, Env>[];
  const { beforeUpdate, afterUpdate } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.UPDATE}: ${event.req.url}`);

    const context = await createWriteContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq(context as never, beforeUpdate as never);

    const rejected = ensureMethod(remote, 'update');
    if (rejected) {
      return respond(event, rejected);
    }

    const validation = await beforeWrite<Ctx, Rec, Env>(context as never, config);
    if (!validation.ok) {
      return respond(event, validation);
    }

    try {
      const response = await remote.update?.(
        context as never,
        config as never,
        context.params[`${config.name}_id`] as never,
        context.body as never
      );
      return afterWrite(context, config, response as never, afterUpdate as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function replace<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: WriteHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as WriteHook<Rec, Ctx, Env>[];
  const { beforeUpdate, afterUpdate } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.REPLACE}: ${event.req.url}`);

    const context = await createWriteContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq(context as never, beforeUpdate as never);

    const rejected = ensureMethod(remote, 'replace');
    if (rejected) {
      return respond(event, rejected);
    }

    const validation = await beforeWrite(context as never, config);
    if (!validation.ok) {
      return respond(event, validation);
    }

    try {
      const response = await remote.replace?.(
        context as never,
        config as never,
        context.params[`${config.name}_id`] as never,
        context.body as never
      );
      return afterWrite(context, config, response as never, afterUpdate as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export function remove<
  Rec extends Json = Json,
  Ctx extends Init = Init,
  Env extends RestEnv = RestEnv,
  Xtr extends Json = Json,
>(...hooks: ReadHooks<Rec, Ctx, Env, Xtr>) {
  const config = hooks.find((h) => typeof h !== 'function') as EndpointConfig<Rec, Ctx, Xtr>;
  const middleware = hooks.filter((h) => typeof h === 'function') as ReadHook<Rec, Ctx, Env>[];
  const { beforeDelete, afterDelete } = config?.hooks ?? {};

  return async (event: Context<Env>) => {
    logger.debug(`${CrudMethod.DELETE}: ${event.req.url}`);

    const context = createContext<Ctx, Rec, Env>(event, config.schema);

    for (const hook of middleware) {
      const res = await hook(context, config);
      if (res instanceof Response) return res;
    }

    const { remote } = await beforeReq(context as never, beforeDelete as never);

    const rejected = ensureMethod(remote, 'deleteOne');
    if (rejected) {
      return respond(event, rejected);
    }

    try {
      const response = await remote.deleteOne?.(
        context as never,
        config as never,
        context.params[`${config.name}_id`] as never
      );
      return afterRead(context, config, response as never, afterDelete as never);
    } catch (err) {
      return error(err as Error, [
        {
          code: 'internal',
          field: 'service',
          message: (err as Error)?.message ?? 'Internal server error',
        },
      ]);
    }
  };
}

export const ensureMethod = (
  remote: RestDriver<Init>,
  method: keyof RestDriver<Init>,
  alias?: string
): RestResponse | void => {
  if (!remote) {
    return restError([
      {
        code: 'unavailable',
        field: 'remote',
        message: 'Remote service not available. Have you set up the remote middleware?',
      },
    ]);
  }

  if (typeof remote[method] !== 'function') {
    return restError([
      {
        code: 'not-allowed',
        field: `method:${alias ?? method}`,
        message: `${alias ?? method} method not allowed`,
      },
    ]);
  }
};
