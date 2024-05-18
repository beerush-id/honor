import type { Context } from 'hono';
import type { CookieOptions as Options } from 'hono/utils/cookie';
import { deleteCookie, getCookie, getSignedCookie, setCookie, setSignedCookie } from 'hono/cookie';
import { isString, typify } from '@beerush/utilities';

export type CookieInit<T extends Record<string, unknown>> = {
  secret: string;
  payload?: T;
};

export type Cookie<T extends Record<string, unknown> = Record<string, unknown>> = {
  all: () => T;
  get: (name: keyof T, fallback?: T[keyof T]) => T[keyof T] | void;
  getSigned: (name?: keyof T) => Promise<string | false | void>;
  has: (name: keyof T) => boolean;
  set: (name: keyof T, value: T[keyof T], options?: Options) => void;
  setSigned: (name: keyof T, value: T[keyof T], options?: Options) => Promise<void>;
  remove: (name: keyof T, options?: Options) => void;
};

export function createCookie<T extends Record<string, unknown>>(c: Context, init: CookieInit<T>): Cookie<T> {
  return {
    all: () => {
      return getCookie(c) as T;
    },
    get: (name) => {
      let value = getCookie(c, name as never);

      if (!value && init?.payload?.[name]) {
        value = init.payload[name] as never;
        setCookie(c, name as never, `${value}`);
      }

      return typify(value as string) as T[keyof T];
    },
    getSigned: async (name) => {
      return getSignedCookie(c, init.secret, name as never);
    },
    has: (name) => {
      return typeof getCookie(c, name as never) !== 'undefined';
    },
    set: (name, value, options) => {
      const val = isString(value) ? value : JSON.stringify(value);
      return setCookie(c, name as never, val, options);
    },
    setSigned: async (name, value, options) => {
      const val = isString(value) ? value : JSON.stringify(value);
      return setSignedCookie(c, init.secret, name as never, val, options);
    },
    remove: (name, options) => {
      return deleteCookie(c, name as never, options);
    },
  };
}

export function cookie<T extends Record<string, string>>(init: CookieInit<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    Object.assign(c.var, {
      cookie: createCookie(c, {
        ...init,
        secret: init?.secret ?? c.env.HS_API_SECRET,
      }),
    });
    await next();
  };
}
