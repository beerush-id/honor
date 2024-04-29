import type { Context, MiddlewareHandler } from 'hono';
import type { RedirectStatusCode, StatusCode } from 'hono/utils/http-status';
import { logger } from './utils';

export type Flat = Record<string, string>;
export type Json = Record<string, unknown>;

export type Listing<T extends Json = Json> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    page: number;
  };
};
export type JsonValue = Json | Json[] | string | number | boolean | null | unknown;
export type APIError = {
  code?: string;
  field?: string;
  message?: string;
};

export type RestResponse<T extends Json = Json> = {
  ok: boolean;
  status: StatusCode;
  body: T;
  multiple?: boolean;
  statusText?: string;
  headers?: Flat;
};

export function respond<T extends Json = Json>(c: Context, response: RestResponse<T>) {
  if (response.ok) {
    return c.json(response.body as never);
  } else {
    return c.json(response.body as never, response.status);
  }
}

export function redirect(url: string, status: RedirectStatusCode = 302) {
  return new Response(null, {
    status,
    headers: {
      location: url,
    },
  });
}

export function json<T extends Json = Json>(body: T, status: StatusCode = 200) {
  return new Response(stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export function error(error: Error, messages?: APIError[]) {
  logger.error(error);

  return new Response(
    stringify({
      errors: messages ?? [
        {
          code: 'internal',
          field: 'service',
          message: 'Internal server error',
        },
      ],
    }),
    {
      status: 500,
      statusText: 'Internal server error',
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}

export function unauthorized(error?: APIError) {
  return new Response(
    stringify({
      errors: [
        {
          code: error?.code ?? 'unauthorized',
          field: error?.field ?? 'authorization',
          message: error?.message ?? 'Unauthorized',
        },
      ],
    }),
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}

export function notFound(error?: APIError) {
  return new Response(
    stringify({
      errors: [
        {
          code: error?.code ?? 'not-found',
          field: error?.field ?? 'path',
          message: error?.message ?? 'Not found',
        },
      ],
    }),
    {
      status: 404,
      statusText: 'Not found',
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}

export function forbidden(error?: APIError) {
  return new Response(
    stringify({
      errors: [
        {
          code: error?.code ?? 'forbidden',
          field: error?.field ?? 'authorization',
          message: error?.message ?? 'Forbidden',
        },
      ],
    }),
    {
      status: 403,
      statusText: 'Forbidden',
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}

export function badRequest(errors?: APIError[]) {
  return new Response(
    stringify({
      errors: errors ?? [
        {
          code: 'bad-request',
          field: 'request',
          message: 'Bad request',
        },
      ],
    }),
    {
      status: 400,
      statusText: 'Bad request',
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}

export function stringify(body: JsonValue) {
  return JSON.stringify(body);
}

export const debugStart = (): MiddlewareHandler => {
  return async (c: Context, next) => {
    c.set('startTime', Date.now());
    logger.verbose(`Request: ${c.req.method} ${c.req.url}`);
    await next();
  };
};

export function debugEnd(c: Context) {
  const startTime = c.get('startTime');
  if (startTime) {
    const duration = Date.now() - startTime;
    logger.verbose(`Request: ${c.req.method} ${c.req.url} took ${duration}ms.`);
  }
}
