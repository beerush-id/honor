type ContentType = 'application/json' | 'text/html' | 'text/plain' | 'multipart/form-data';
type CacheControl = 'no-store' | 'no-cache' | 'max-age=0' | 'must-revalidate' | 'private' | 'public';
type EncodingTypes = 'gzip' | 'compress' | 'br' | 'deflate' | 'identity' | '*';
type CorsHeaders = '*' | 'true' | 'false' | string;

// Common headers between request and response
export type CommonHeaders = {
  Accept?: string;
  Cookie?: string;
  'Content-Type'?: ContentType;
  'Cache-Control'?: CacheControl;
  'Content-Length'?: string;
  'Accept-Encoding'?: EncodingTypes;
  'If-Modified-Since'?: string;
  'If-None-Match'?: string;
  'If-Match'?: string;
  'If-Unmodified-Since'?: string;
};

// Request specific headers
export type RequestHeadersInit<T extends Record<string, unknown> = Record<string, unknown>> =
  | (CommonHeaders & {
      Authorization?: string;
      DNT?: '1' | '0';
      'User-Agent'?: string;
      'X-Requested-With'?: string;
      'Access-Control-Request-Method'?: string;
      'Access-Control-Request-Headers'?: string;
    })
  | T;

// Response specific headers
export type ResponseHeadersInit<T extends Record<string, unknown> = Record<string, unknown>> =
  | (CommonHeaders & {
      ETag?: string;
      Location?: string;
      'Set-Cookie'?: string;
      'Access-Control-Allow-Origin'?: CorsHeaders;
      'Access-Control-Allow-Methods'?: string;
      'Access-Control-Allow-Headers'?: string;
      'Access-Control-Allow-Credentials'?: CorsHeaders;
      'Access-Control-Expose-Headers'?: string;
      'Access-Control-Max-Age'?: string;
    })
  | T;

export type HttpHeaders<T extends Record<string, unknown> = Record<string, unknown>> = {
  get(name: keyof T): T[keyof T] | null;
  set(name: keyof T, value: T[keyof T]): void;
  has(name: keyof T): boolean;
  delete(name: keyof T): void;
  append(name: keyof T, value: T[keyof T]): void;
};

export type RequestHeaders<T extends Record<string, unknown> = Record<string, unknown>> = HttpHeaders<
  RequestHeadersInit<T>
>;
export type ResponseHeaders<T extends Record<string, unknown> = Record<string, unknown>> = HttpHeaders<
  ResponseHeadersInit<T>
>;

export function createHeaders<T extends Record<string, unknown> = Record<string, unknown>>(init?: T): HttpHeaders<T> {
  return new Headers(init as never) as never;
}

export function toJson<T extends Record<string, string>>(headers: Headers): T {
  const result: Record<string, string> = {};

  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result as T;
}

export function responseHeaders<T extends Record<string, unknown> = Record<string, unknown>>(
  origins: string[] = ['*']
): ResponseHeaders<T> {
  return createHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origins.join(','),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }) as never;
}
