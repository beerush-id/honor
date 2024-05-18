import { isObject } from '@beerush/utilities';

type Unsubscribe = (() => void) & {
  unsubscribe: () => void;
};
type SubscribeFn<T> = (value: T) => void;

export type Stream<T> = {
  body?: T;
  response?: Response;
  subscribe: (handler: SubscribeFn<T>, init?: boolean) => Unsubscribe;
  set: (response: Response) => void;
};

export async function stream<T>(url: string, init?: RequestInit): Promise<Stream<T>>;
export async function stream<T>(url: string, direct: boolean): Promise<Stream<T>>;
export async function stream<T>(url: string, init: RequestInit, direct: boolean): Promise<Stream<T>>;
export async function stream<T>(url: string, init?: RequestInit | boolean, direct?: boolean): Promise<Stream<T>> {
  const handlers = new Set<SubscribeFn<T>>();

  const reqInit = isObject<RequestInit>(init) ? init : undefined;
  const promise = fetch(url, reqInit);
  const waitNow = init === true || direct || typeof window === 'undefined';

  const instance: Stream<T> = {
    body: undefined,
    response: undefined,
    subscribe(handler: SubscribeFn<T>, init?: boolean): Unsubscribe {
      handlers.add(handler);

      if (init) {
        handler(instance.body as T);
      }

      const unsubscribe = () => {
        handlers.delete(handler);
      };
      unsubscribe.unsubscribe = () => {
        handlers.delete(handler);
      };

      return unsubscribe;
    },
    set(response: Response) {
      instance.response = response;
      publish();
    },
  };

  const publish = () => {
    for (const handler of handlers) {
      handler(instance.body as T);
    }
  };

  if (waitNow) {
    const response = await promise;
    await transform(response, instance);
  } else {
    promise
      .then(async (res) => {
        await transform(res, instance);
      })
      .catch((err) => {
        const body = JSON.stringify({
          errors: [
            {
              code: 'internal_error',
              field: 'stream',
              message: err?.message ?? 'An error occurred while fetching the stream.',
            },
          ],
        });

        instance.set(new Response(body, { status: 500, statusText: err.message }));
      });
  }

  return instance as never;
}

async function transform(res: Response, instance: Stream<unknown>) {
  try {
    instance.body = await res.json();
  } catch (err) {
    instance.body = undefined;
  }

  instance.set(res);
}
