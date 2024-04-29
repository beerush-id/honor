export type TransformOptions = {
  keys?: Record<string, string>;
  values?: Record<string, (value: unknown, origin: Record<string, unknown>) => unknown>;
  omittedKeys?: string[];
};

export function transform(value: Record<string, unknown>, options: TransformOptions) {
  if (options.values) {
    for (const [key, exec] of Object.entries(options.values)) {
      value[key] = exec(value[key], value);
    }

    if (options.keys) {
      for (const [key, mappedKey] of Object.entries(options.keys)) {
        value[mappedKey] = value[key];
        delete value[key];
      }
    }

    if (options.omittedKeys) {
      for (const key of options.omittedKeys) {
        delete value[key];
      }
    }

    return value;
  }
}

export function typify(value: unknown) {
  if (typeof value !== 'string') return value;

  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  } else if (!isNaN(+value)) {
    return +value;
  } else {
    return value;
  }
}
