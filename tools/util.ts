export function assertExhaustive(_impossibleValue: never) {
  throw new Error('Conditions should be exhaustive.');
}

export function removeKey<T, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const converted = obj as Omit<T, K> & Record<K, unknown>;
  delete converted[key];
  return converted;
}

export function isNil(value: unknown): value is null | undefined {
  // Note the double equals, so this includes undefined.
  return value == null;
}
