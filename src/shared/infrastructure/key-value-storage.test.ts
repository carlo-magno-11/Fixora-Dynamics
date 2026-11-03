import { describe, expect, it } from "vitest";
import { createNamespacedKeyValueStorage, type KeyValueStorage } from "./key-value-storage";

function createMemoryStorage(): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("createNamespacedKeyValueStorage", () => {
  it("isolates the same key between users and businesses", () => {
    const backing = createMemoryStorage();
    const first = createNamespacedKeyValueStorage(backing, "user-a:business-1");
    const second = createNamespacedKeyValueStorage(backing, "user-b:business-1");
    first.setItem("fixora.catalog.v1", "first");
    second.setItem("fixora.catalog.v1", "second");
    expect(first.getItem("fixora.catalog.v1")).toBe("first");
    expect(second.getItem("fixora.catalog.v1")).toBe("second");
  });

  it("encodes namespace boundaries and never exposes another namespace", () => {
    const backing = createMemoryStorage();
    const first = createNamespacedKeyValueStorage(backing, "user:business");
    const second = createNamespacedKeyValueStorage(backing, "user");
    first.setItem("history", "private");
    expect(second.getItem("business:history")).toBeNull();
  });
});
