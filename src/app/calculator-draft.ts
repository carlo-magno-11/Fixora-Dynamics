import type { CalculatorDraft } from "../modules/drafts/domain/calculator-draft";
import { parseCalculatorDraftValue } from "../modules/drafts/domain/calculator-draft";
import { createNamespacedKeyValueStorage, type KeyValueStorage } from "../shared/infrastructure/key-value-storage";

export { parseCalculatorDraftValue };
export type { CalculatorDraft };

export const CALCULATOR_DRAFT_KEY = "fixora.calculator-draft.v1";

export function createCalculatorDraftStorage(storage: KeyValueStorage, businessId: string | null | undefined): KeyValueStorage {
  return createNamespacedKeyValueStorage(storage, `business:${businessId ?? "none"}`);
}

export function readCalculatorDraft(storage: KeyValueStorage): CalculatorDraft | null {
  try {
    const raw = storage.getItem(CALCULATOR_DRAFT_KEY);
    return raw ? parseCalculatorDraftValue(JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function saveCalculatorDraft(
  storage: KeyValueStorage,
  draft: Omit<CalculatorDraft, "version" | "savedAt">,
  now: () => Date = () => new Date(),
): boolean {
  try {
    const savedAt = now().toISOString();
    storage.setItem(CALCULATOR_DRAFT_KEY, JSON.stringify({ ...draft, version: 1, savedAt }));
    return true;
  } catch {
    return false;
  }
}
