export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type KeyValueStorageSource = KeyValueStorage | (() => KeyValueStorage);

export function resolveKeyValueStorage(source: KeyValueStorageSource): KeyValueStorage {
  return typeof source === "function" ? source() : source;
}

export function createNamespacedKeyValueStorage(
  storage: KeyValueStorage,
  namespace: string,
): KeyValueStorage {
  const prefix = `fixora:${encodeURIComponent(namespace)}:`;
  return {
    getItem(key) {
      return storage.getItem(`${prefix}${key}`);
    },
    setItem(key, value) {
      storage.setItem(`${prefix}${key}`, value);
    },
  };
}
