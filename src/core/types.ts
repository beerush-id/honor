import { ZodType } from 'zod';
import type { Context as HonoContext } from 'hono';
import { type FlatFields, type OrderBy, type WhereFilter } from './filter.js';
import type { Fields } from '../entity.js';
import type { RequestHeaders, ResponseHeaders } from './header.js';
import type { Logger } from '@beerush/logger';
import type { Cookie } from '../helpers/index.js';

export type Rec = Record<string, unknown>;
export type FlatRec = Record<string, string>;
export type InitRec = Record<string, string | number | boolean | null>;
export type ZPart<T extends Rec = Rec, S extends ZodType<Partial<T>> = ZodType<Partial<T>>> = S;

type Part<T> = Partial<T>;
type InferT<E> = E extends Endpoint<infer T> ? T : never;

export type RestEnv = {
  Variables: {
    logger: Logger<unknown>;
  };
  Bindings: {
    HS_API_SECRET: string;
    HS_API_SESSION_DURATION: number;
  };
};

export type Endpoint<
  T extends Rec = Rec,
  Cp extends Part<T> = Part<T>,
  Up extends Part<T> = Part<T>,
  Rr extends Part<T> = Part<T>,
  Cr extends Part<T> = Part<T>,
  Ur extends Part<T> = Part<T>,
  Dr extends Part<T> = Part<T>,
> = {
  name: Lowercase<string>;
  description?: string;
  primaryKey?: keyof T;
  schema?: ZodType<T>;
  payload?: {
    create?: ZodType<Cp>;
    update?: ZodType<Up>;
  };
  response?: {
    read?: ZodType<Rr>;
    create?: ZodType<Cr>;
    update?: ZodType<Ur>;
    delete?: ZodType<Dr>;
  };
};

export type ReadContext<
  Schema extends Rec = Rec,
  Params extends Rec = Rec,
  Headers extends FlatRec = FlatRec,
  Query extends Rec = Rec,
  C extends Rec = Rec,
  E extends RestEnv = RestEnv,
> = {
  url: URL;
  params: Params;
  cookie: Cookie<C>;
  searchParams: SearchParams<Query>;
  filter: ContextFilter<Schema>;
  headers: RequestHeaders<Headers>;
  event: HonoContext<E>;
};

export type SearchParams<T extends Rec = Rec> = Map<keyof T, T[keyof T]>;

export type WriteContext<
  Schema extends Rec = Rec,
  Params extends Rec = Rec,
  Headers extends FlatRec = FlatRec,
  Query extends Rec = Rec,
  Env extends RestEnv = RestEnv,
> = ReadContext<Schema, Params, Headers, Query, Env> & {
  body: Schema;
};

export type ContextFilter<T extends Rec = Rec> = {
  where?: WhereFilter<T>;
  select?: Fields<T> | FlatFields<T>;
  limit?: number;
  offset?: number;
  order?: OrderBy<T>;
};

export type ContextHeaders<T> = {
  Authorization: string;
  'Content-Type': string;
} & T extends Rec
  ? { [K in keyof T]?: string }
  : never;

export type ListingInit<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type ResponseInit<Schema extends Rec = Rec, Headers extends FlatRec = FlatRec> = {
  status: number;
  headers: ResponseHeaders<Headers>;
  body: Schema;
};

export type BeforeList<E> = (context: ReadContext<InferT<E>>) => void | Promise<void>;
export type AfterList<E> = (
  context: ReadContext<InferT<E>>,
  response: ResponseInit<ListingInit<InferT<E>>>
) => void | Promise<void>;

export type BeforeRead<E> = (context: ReadContext<InferT<E>>, id: InferT<E>[keyof InferT<E>]) => void | Promise<void>;
export type AfterRead<E> = (context: ReadContext<InferT<E>>, response: ResponseInit<InferT<E>>) => void | Promise<void>;

export type BeforeCreate<E> = (context: WriteContext<InferT<E>>, body: InferT<E>) => void | Promise<void>;
export type AfterCreate<E> = (
  context: WriteContext<InferT<E>>,
  response: ResponseInit<InferT<E>>
) => void | Promise<void>;

export type BeforeUpdate<E> = (
  context: WriteContext<InferT<E>>,
  id: InferT<E>[keyof InferT<E>],
  body: InferT<E>
) => void | Promise<void>;
export type AfterUpdate<E> = (
  context: WriteContext<InferT<E>>,
  response: ResponseInit<InferT<E>>
) => void | Promise<void>;

export type BeforeDelete<E> = (context: ReadContext<InferT<E>>) => void | Promise<void>;
export type AfterDelete<E> = (
  context: ReadContext<InferT<E>>,
  response: ResponseInit<InferT<E>>
) => void | Promise<void>;

export type BeforeGet<E> = (context: ReadContext<InferT<E>>) => void | Promise<void>;
export type AfterGet<E> = (context: ReadContext<InferT<E>>, response: ResponseInit<InferT<E>>) => void | Promise<void>;

export type BeforePost<E> = (context: WriteContext<InferT<E>>) => void | Promise<void>;
export type AfterPost<E> = (
  context: WriteContext<InferT<E>>,
  response: ResponseInit<InferT<E>>
) => void | Promise<void>;

export type BeforePut<E> = (context: WriteContext<InferT<E>>) => void | Promise<void>;
export type AfterPut<E> = (context: WriteContext<InferT<E>>, response: ResponseInit<InferT<E>>) => void | Promise<void>;

export type BeforePatch<E> = (context: WriteContext<InferT<E>>) => void | Promise<void>;
export type AfterPatch<E> = (
  context: WriteContext<InferT<E>>,
  response: ResponseInit<InferT<E>>
) => void | Promise<void>;
