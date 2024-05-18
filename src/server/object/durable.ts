export class DurableNamespace {
  public ids = new Map<string, string>();
  public objects = new Map<string, DurableObject<unknown>>();

  constructor(
    public env: Record<string, unknown>,
    public ObjectClass: typeof DurableObject
  ) {
    if (!ObjectClass) {
      throw new Error('ObjectClass is required');
    }
  }

  public randomId(): string {
    return crypto.randomUUID();
  }

  public idFromName(name: string): string {
    let id = this.ids.get(name);

    if (!id) {
      id = this.randomId();
      this.ids.set(name, id);
    }

    return id;
  }

  public get<T>(id: string): DurableObject<T> {
    let obj = this.objects.get(id);

    if (!obj) {
      obj = new (this.ObjectClass as new (...args: unknown[]) => unknown)(state<T>(), this.env) as never;
      this.objects.set(id, obj);
    }

    return obj as DurableObject<T>;
  }
}

export abstract class DurableObject<T> {
  protected constructor(
    public state: T,
    public env: Record<string, unknown>
  ) {}

  public abstract fetch(request: Request): Promise<T>;
}

export type DurableState<T> = {
  set: (value: T) => void;
  get: () => T;
  update: (fn: (value?: T) => T) => void;
};

export function state<T>(init?: T): DurableState<T> {
  let value = init;

  return {
    set: (v: T) => (value = v),
    get: () => value as never,
    update: (fn: (value?: T) => T) => (value = fn(value)),
  };
}
