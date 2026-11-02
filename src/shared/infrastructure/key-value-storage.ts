export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type KeyValueStorageSource = KeyValueStorage | (() => KeyValueStorage);

export function resolveKeyValueStorage(source: KeyValueStorageSource): KeyValueStorage {
  return typeof source === "function" ? source() : source;
}
