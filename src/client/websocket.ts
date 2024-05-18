export type Operation = (RequestOperation | SubscriptionOperation) & {
  id: string;
};

export type RequestOperation = {
  type: 'request';
  data: RequestData;
};

export type RequestData = {
  url: string;
  method: string;
  body?: unknown;
  headers: Record<string, string>;
};

export type SubscriptionOperation = {
  type: 'subscription';
  data: SubscriptionData;
};

export type OperationResponse = Operation & {
  status: number;
  statusText: string;
};

export type SubscriptionData = {
  channel: string;
  headers: Record<string, string>;
};

export type ClientConfig = {
  timeout?: number;
};

export function createClient(url: string, config?: ClientConfig) {
  let client: WebSocket | undefined;

  const queues: Operation[] = [];
  const reqHandlers = new Map<string, (response: Response) => void>();

  const initialize = () => {
    client = new WebSocket(url);

    client.onopen = () => {
      while (queues.length) {
        client?.send(JSON.stringify(queues.shift()));
      }
    };

    client.onmessage = (message) => {
      const event = JSON.parse(message.data) as OperationResponse;

      if (event.type === 'request') {
        const handler = reqHandlers.get(event.id);

        if (handler) {
          const response = new Response(JSON.stringify(event.data.body), {
            status: event.status,
            statusText: event.statusText,
            headers: new Headers(event.data.headers),
          });

          handler(response);
        }
      }

      if (event.type === 'subscription') {
        // handle subscription
      }
    };

    client.onclose = () => {
      client = undefined;
      setTimeout(initialize, 1000);
    };
  };

  return {
    fetch: async (path: string, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        const id = crypto.randomUUID();
        const operation: Operation = {
          id,
          type: 'request',
          data: {
            url: path,
            body: init?.body,
            method: init?.method ?? 'GET',
            headers: (init?.headers as Record<string, string>) ?? {},
          },
        };

        let timer: number;
        if (config?.timeout) {
          timer = setTimeout(() => {
            reject(new Error('Request timeout'));
            reqHandlers.delete(id);
          }, config.timeout) as never;
        }

        reqHandlers.set(id, async (res: Response) => {
          clearTimeout(timer);
          reqHandlers.delete(id);

          resolve(res);
        });

        if (client) {
          client.send(JSON.stringify(operation));
        } else {
          queues.push(operation);
          initialize();
        }
      });
    },
    subscribe: (channel: string, headers: Record<string, string>) => {},
  };
}
