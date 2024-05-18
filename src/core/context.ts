import type { Context } from 'hono';
import type { ReadContext, WriteContext } from './types.js';
import { parseParams } from './param.js';
import { createCookie } from '../helpers/index.js';

export function createReadContext(event: Context): ReadContext {
  const { req } = event;

  const url = new URL(req.url);
  const searchParams = parseParams(url.searchParams);
  const cookie = createCookie(event, { secret: event.env.HS_API_SECRET });

  return {
    url,
    event,
    cookie,
    searchParams,
    params: req.param(),
    filter: (searchParams.get('filter') as never) ?? {},
    headers: req.raw?.headers ?? (req as never as Request).headers ?? new Headers(),
  };
}

export function createWriteContext(c: Context): WriteContext {
  return {
    event: c,
  } as WriteContext;
}
