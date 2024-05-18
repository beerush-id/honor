import { typify } from '@beerush/utilities';
import type { SearchParams } from './types.js';

export function parseParams<T extends Record<string, unknown> = Record<string, unknown>>(
  params: URLSearchParams
): SearchParams<T> {
  const map = new Map<keyof T, T[keyof T]>();

  params.forEach((value, key) => {
    map.set(key as keyof T, typify(value) as T[keyof T]);
  });

  return map;
}
