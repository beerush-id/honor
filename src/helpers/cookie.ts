import type { CookieOptions as Options } from 'hono/utils/cookie';
import { deleteCookie, getCookie, getSignedCookie, setCookie, setSignedCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { typify } from '../utils/index.js';

export type CookieInit<T extends Record<string, CookieValue>> = {
  secret: string;
  payload?: T;
};

export type CookieValue = string;

export type Cookie<T extends Record<string, CookieValue>> = {
  all: () => T;
  get: (name: keyof T, fallback?: T[keyof T]) => T[keyof T] | void;
  getSigned: (name?: keyof T) => Promise<string | false | void>;
  set: (name: keyof T, value: T[keyof T], options?: Options) => void;
  setSigned: (name: keyof T, value: T[keyof T], options?: Options) => Promise<void>;
  remove: (name: keyof T, options?: Options) => void;
};

export function createCookie<T extends Record<string, CookieValue>>(c: Context, init: CookieInit<T>): Cookie<T> {
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
    set: (name, value, options) => {
      return setCookie(c, name as never, value as never, options);
    },
    setSigned: async (name, value, options) => {
      return setSignedCookie(c, init.secret, name as never, value as never, options);
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
