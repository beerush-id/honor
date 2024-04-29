export type GenericType =
  | 'string'
  | 'number'
  | 'object'
  | 'array'
  | 'date'
  | 'function'
  | 'boolean'
  | 'null'
  | 'regexp'
  | 'error'
  | 'map'
  | 'set'
  | 'undefined';

export const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;

/**
 * Get the generic type of the given value. Unlike `typeof`, the returned type will be a generic type. For example,
 * calling `typeOf([])` will return `array` instead of `object`.
 * @param value
 * @returns {GenericType}
 */
export function typeOf(value: unknown): GenericType {
  return toString
    .call(value)
    .replace(/\[object /, '')
    .replace(/]/, '')
    .toLowerCase() as GenericType;
}

/**
 * Check if the given value is a string.
 * @param value
 * @returns {boolean}
 */
export function isString(value: unknown): boolean {
  return typeof value === 'string';
}

/**
 * Check if the given value is a number.
 * @param value
 * @returns {boolean}
 */
export function isNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if the given value is an even number.
 * @param {number} n
 * @returns {boolean}
 */
export function isEven(n: number): boolean {
  return n % 2 === 0;
}

/**
 * Check if the given value is an odd number.
 * @param {number} n
 * @returns {boolean}
 */
export function isOdd(n: number): boolean {
  return n % 2 !== 0;
}

/**
 * Check if the given value is integer.
 * @param {number} n
 * @returns {boolean}
 */
export function isInt(n: unknown) {
  if (typeof n !== 'number' || isNaN(n)) return false;
  return n % 1 === 0;
}

/**
 * Check if the given value is float.
 * @param {number} n
 * @returns {boolean}
 */
export function isFloat(n: unknown) {
  if (typeof n !== 'number' || isNaN(n)) return false;
  return n % 1 !== 0;
}

/**
 * Check if the given value is a numeric string.
 * @param {string} value
 * @returns {boolean}
 */
export function isNumberString(value: unknown): boolean {
  if (typeof value !== 'string' || value === '') return false;
  const n = value.match(/^-\d+(\.\d+)?$|^\d+(\.\d+)?$/);
  return n !== null && n.length > 0;
}

/**
 * Check if the given value is a unit string (e.g, 120px, -10.5pt, -100cm).
 * @param {string} value
 * @returns {boolean}
 */
export function isUnitString(value: unknown): boolean {
  return typeof value === 'string' && /^-?\d*(\.\d+)?\w+$/.test(value);
}

/**
 * Check if the given value is a pure object (not array, date, etc).
 * @param value
 * @returns {boolean}
 */
export function isObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Check if the given value is an object-like (not array, date, etc).
 * @param value
 * @returns {boolean}
 */
export function isObjectLike(value: unknown): boolean {
  return typeOf(value) === 'object';
}

/**
 * Check if the given value is an array.
 * @param value
 * @returns {boolean}
 */
export function isArray(value: unknown): boolean {
  return Array.isArray(value);
}

/**
 * Check if the given value is a date object.
 * @param value
 * @returns {boolean}
 */
export function isDate(value: unknown): boolean {
  return typeOf(value) === 'date';
}

/**
 * Check if the given value is a date string.
 * @param {string} value
 * @returns {boolean}
 */
export function isDateString(value: unknown): boolean {
  if (typeof value !== 'string' || value === '') return false;
  try {
    const beginDate = new Date(0);
    const currentDate = new Date(value);
    return !isNaN(currentDate.getTime()) && currentDate > beginDate;
  } catch (e) {
    return false;
  }
}

/**
 * Check if the given value is a function.
 * @param value
 * @returns {boolean}
 */
export function isFunction(value: unknown): boolean {
  return typeof value === 'function';
}

/**
 * Check if the given value is a boolean.
 * @param value
 * @returns {boolean}
 */
export function isBoolean(value: unknown): boolean {
  return typeof value === 'boolean';
}

/**
 * Check if the given value is a boolean string.
 * @param {string} value
 * @returns {boolean}
 */
export function isBooleanString(value: unknown): boolean {
  return value === 'true' || value === 'false';
}

/**
 * Check if the given value is a map.
 * @param value
 * @returns {boolean}
 */
export function isMap(value: unknown): boolean {
  return typeOf(value) === 'map';
}

/**
 * Check if the given value is a set.
 * @param value
 * @returns {boolean}
 */
export function isSet(value: unknown): boolean {
  return typeOf(value) === 'set';
}

/**
 * Check if the given value is a regular expression.
 * @param value
 * @returns {boolean}
 */
export function isRegExp(value: unknown): boolean {
  return typeOf(value) === 'regexp';
}

/**
 * Check if the given value is an error object.
 * @param value
 * @returns {boolean}
 */
export function isError(value: unknown): boolean {
  return typeOf(value) === 'error';
}

/**
 * Check if the given value is a defined value.
 * @param value
 * @returns {boolean}
 */
export function isDefined(value: unknown): boolean {
  return !isNullish(value);
}

/**
 * Check if the given value is a nullish, including NaN.
 * @param value
 * @returns {boolean}
 */
export function isNullish(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'number' && isNaN(value as number));
}

/**
 * Check if the given value is a falsy but excludes 0, negative number, and empty string.
 * @param value
 * @returns {boolean}
 */
export function isFalsy(value: unknown): boolean {
  return isNullish(value) || (typeof value === 'boolean' && !value);
}

/**
 * Check if the given value is a truthy value.
 * @param value
 * @returns {boolean}
 */
export function isTruthy(value: unknown): boolean {
  return !isFalsy(value);
}

/**
 * Check if the given value is a positive value, including 0.
 * @param value
 * @returns {boolean}
 */
export function isPositive(value: unknown): boolean {
  return typeof value === 'number' && value >= 0;
}

/**
 * Check if the given value is an empty value. This includes empty string, empty array, and empty object.
 * @param value
 * @returns {boolean}
 */
export function isEmpty(value: unknown): boolean {
  if (isNullish(value)) return true;
  if (isString(value)) return (value as string).length === 0;
  if (isArray(value)) return (value as unknown[]).length === 0;
  if (isObject(value)) return Object.keys(value as Record<string, unknown>).length === 0;
  if (typeof value === 'number') return value <= 0;
  if (isSet(value) || isMap(value)) return (value as Set<unknown>).size === 0;

  return false;
}

/**
 * Check if the current environment is a browser.
 * @returns {boolean}
 */
export function isBrowser(): boolean {
  return typeof window === 'object';
}