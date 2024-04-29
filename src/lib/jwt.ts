import { type Json, unauthorized } from '../common.js';
import type { Context, Env } from 'hono';
import { sign as signPayload, verify } from 'hono/jwt';
import { JwtHeaderInvalid, type JWTPayload, JwtTokenExpired, JwtTokenInvalid } from 'hono/utils/jwt/types';

export type SignOptions = {
  secret: string;
  payload: Json;
  expiresIn?: string;
};

export const sign = async (options: SignOptions) => {
  const payload = { ...options.payload, exp: futureAlt(options.expiresIn ?? '24h') };
  return await signPayload(payload, options.secret);
};

export const futureAlt = (duration: string | number) => {
  if (typeof duration === 'number') return duration;

  const [, value, unit] = (duration ?? '').match(/(\d+)(\w+)/) || [];
  if (!value) return 60 * 60;

  if (unit === 's') {
    return future(+value);
  } else if (unit === 'm') {
    return future(+value * 60);
  } else if (unit === 'h') {
    return future(+value * 60 * 60);
  } else if (unit === 'd') {
    return future(+value * 60 * 60 * 24);
  }

  return future(+value);
};

export const future = (duration: number) => {
  return Math.floor(Date.now() / 1000) + duration;
};

export type JWTEnv = Env & {
  Variables: Env['Variables'] & {
    jwt: JWT;
    auth: JWTPayload;
    sessionId: string;
  };
  Bindings: Env['Bindings'] & {
    HS_API_SECRET: string;
    HS_API_SESSION_DURATION: string;
  };
};

export type JWT = {
  sign: (payload: Json) => Promise<string>;
  verify: (token: string) => Promise<JWTPayload & Record<string, unknown>>;
};

export function createHelper(c: Context<JWTEnv>): JWT {
  const { HS_API_SECRET, HS_API_SESSION_DURATION } = c.env;
  return {
    sign: async (payload: Json) => sign({ payload, secret: HS_API_SECRET, expiresIn: HS_API_SESSION_DURATION }),
    verify: async (token: string) => verify(token, HS_API_SECRET),
  };
}

export function jwtHelper() {
  return async (c: Context<JWTEnv>) => {
    c.set('jwt', createHelper(c));
  };
}

export function jwt() {
  return async (c: Context<JWTEnv>, next: () => Promise<void>) => {
    const headers = new Headers(c.req.header());
    const token = headers.get('authorization');
    const jwt = createHelper(c);

    if (!token || !token.startsWith('Bearer ')) {
      return unauthorized();
    }

    try {
      const payload = await jwt.verify(token.replace('Bearer ', ''));
      c.set('auth', payload);
    } catch (error) {
      if (error instanceof JwtTokenExpired) {
        return unauthorized({ code: 'expired', message: 'JWT token expired' });
      } else if (error instanceof JwtTokenInvalid) {
        return unauthorized({ code: 'invalid', message: 'JWT token invalid' });
      } else if (error instanceof JwtHeaderInvalid) {
        return unauthorized({ code: 'invalid', message: 'JWT header invalid' });
      }

      return unauthorized();
    }

    await next();
  };
}
