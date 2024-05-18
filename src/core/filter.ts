import type { NestedPath, NestedPaths } from '@beerush/utilities';

export type WhereFilter<T extends object> = {
  [K in keyof T]?: T[K] extends object
    ? WhereFilter<T[K]>
    : T[K] extends string | null
      ? T[K] | StringFilter | OrFilter<T[K]> | AndFilter<T[K]>
      : T[K] extends number | null
        ? T[K] | NumericFilter | OrFilter<T[K]> | AndFilter<T[K]>
        : T[K] | Filter<T[K]> | OrFilter<T[K]> | AndFilter<T[K]>;
};

export type FilterArg<T> = T extends string ? T | StringFilter : T extends number ? T | NumericFilter : T | Filter<T>;
export type OrFilter<T> = [
  'OR',
  ...(T extends string ? StringFilter | T : T extends number ? NumericFilter | T : Filter<T> | T)[],
];
export type AndFilter<T> = [
  'AND',
  ...(T extends string ? StringFilter | T : T extends number ? NumericFilter | T : Filter<T> | T)[],
];

export type Filter<T> = {
  eq?: T;
  neq?: T;
  isNull?: boolean;
  isNotNull?: boolean;
  exists?: boolean;
  notExists?: boolean;
};

export type StringFilter = Filter<string> & {
  like?: string;
  notLike?: string;
  iLike?: string;
  notILike?: string;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  notContains?: string;
};

export type NumericFilter = Filter<number> & {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  between?: [number, number];
  notBetween?: [number, number];
};

export type OrderBy<T> = T extends object ? Array<`${NestedPath<T>}:${'asc' | 'desc'}`> : never;
export type FlatFields<T> = T extends object ? NestedPaths<T> : never;

export function eq<T>(value: T): Filter<T> {
  return { eq: value };
}

export function neq<T>(value: T): Filter<T> {
  return { neq: value };
}

export function isNull<T>(): Filter<T> {
  return { isNull: true };
}

export function isNotNull<T>(): Filter<T> {
  return { isNotNull: true };
}

export function exists<T>(): Filter<T> {
  return { exists: true };
}

export function notExists<T>(): Filter<T> {
  return { notExists: true };
}

export function like(value: string): StringFilter {
  return { like: value };
}

export function notLike(value: string): StringFilter {
  return { notLike: value };
}

export function iLike(value: string): StringFilter {
  return { iLike: value };
}

export function notILike(value: string): StringFilter {
  return { notILike: value };
}

export function startsWith(value: string): StringFilter {
  return { startsWith: value };
}

export function endsWith(value: string): StringFilter {
  return { endsWith: value };
}

export function contains(value: string): StringFilter {
  return { contains: value };
}

export function notContains(value: string): StringFilter {
  return { notContains: value };
}

export function gt(value: number): NumericFilter {
  return { gt: value };
}

export function gte(value: number): NumericFilter {
  return { gte: value };
}

export function lt(value: number): NumericFilter {
  return { lt: value };
}

export function lte(value: number): NumericFilter {
  return { lte: value };
}

export function between(a: number, b: number): NumericFilter {
  return { between: [a, b] };
}

export function notBetween(a: number, b: number): NumericFilter {
  return { notBetween: [a, b] };
}

export function or<T>(...filters: FilterArg<T>[]): OrFilter<T> {
  return ['OR', ...filters] as never;
}

export function and<T>(...filters: FilterArg<T>[]): AndFilter<T> {
  return ['AND', ...filters] as never;
}

export function filter<T extends object>(filter: WhereFilter<T>): WhereFilter<T> {
  return filter;
}
