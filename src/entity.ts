import { isArray, isObject } from '@beerush/utilities';

export type Entity = Record<string, unknown>;

export type Fields<Target> =
  Target extends Array<infer Item>
    ? Fields<Item>
    : Target extends object
      ? {
          [Key in keyof Target]?: Fields<Target[Key]> | true;
        }
      : false;

export type Selection<Target, Filter extends Fields<Target>> = Target extends object
  ? {
      [Key in keyof Filter]: Key extends keyof Target
        ? Filter[Key] extends true
          ? Target[Key]
          : Filter[Key] extends Fields<Target[Key]>
            ? Target[Key] extends Array<unknown>
              ? Selection<Target[Key][number], Filter[Key]>[]
              : Selection<Target[Key], Filter[Key]>
            : Target[Key]
        : never;
    }
  : Target;

export function select<T extends Entity, F extends Fields<T>>(entity: T, fields: F): Selection<T, F> {
  if (!isObject(entity) && !isArray(entity)) {
    return entity as never;
  }

  const result: Partial<T> = {};

  for (const [key, sel] of Object.entries(fields)) {
    if (sel === true) {
      result[key as keyof T] = entity[key as keyof T];
    } else if (typeof sel === 'object' && isObject(sel)) {
      const value = entity[key as keyof T];

      if (Array.isArray(value)) {
        result[key as keyof T] = selectAll(value as never, sel as never) as never;
      } else if (isObject(value)) {
        result[key as keyof T] = select(value as never, sel as never) as never;
      } else {
        console.warn(`Selection mismatch for key: "${key}". Expected object, got ${typeof value}`);
        result[key as keyof T] = value;
      }
    }
  }

  return result as never;
}

export function selectAll<T extends Entity, F extends Fields<T>>(entities: T[], fields: F): Selection<T, F>[] {
  return entities.map((entity) => select(entity, fields)) as never;
}
