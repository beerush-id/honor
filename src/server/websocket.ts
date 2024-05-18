export type OperationType = 'request' | 'subscription';

export type Operation = RequestOperation | SubscriptionOperation;

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

export type SubscriptionData = {
  channel: string;
  headers: Record<string, string>;
};

export function createClient(url: string) {
  let client: WebSocket | undefined;
  const queue: Operation[] = [];

  const initialize = () => {
    client = new WebSocket(url);

    client.onopen = () => {
      while (queue.length) {
        client?.send(JSON.stringify(queue.shift()));
      }
    };

    client.onmessage = (event) => {
      const operation = JSON.parse(event.data) as Operation;

      if (operation.type === 'subscription') {
        // handle subscription
      }
    };

    client.onclose = () => {
      client = undefined;
      setTimeout(initialize, 1000);
    };
  };

  return {
    send: (operation: Operation) => {
      if (client) {
        client.send(JSON.stringify(operation));
      } else {
        queue.push(operation);
        initialize();
      }
    },
  };
}
