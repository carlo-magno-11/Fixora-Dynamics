import type { CalculatorDraft } from "../domain/calculator-draft";
import { parseCalculatorDraftValue } from "../domain/calculator-draft";

export interface StoredCloudCalculatorDraft {
  value: unknown;
  version: number;
}

export interface CloudCalculatorDraftRepositoryPort {
  load(businessId: string): Promise<StoredCloudCalculatorDraft | null>;
  save(businessId: string, draft: CalculatorDraft, expectedVersion: number): Promise<number>;
}

export interface CloudCalculatorDraftApplicationService {
  load(businessId: string): Promise<{
    draft: CalculatorDraft | null;
    version: number;
    invalid: boolean;
  }>;
  save(businessId: string, draft: CalculatorDraft, expectedVersion: number): Promise<number>;
}

export function createCloudCalculatorDraftApplicationService(
  repository: CloudCalculatorDraftRepositoryPort,
): CloudCalculatorDraftApplicationService {
  return {
    async load(businessId) {
      const stored = await repository.load(businessId);
      if (!stored) return { draft: null, version: 0, invalid: false };
      const draft = parseCalculatorDraftValue(stored.value);
      return {
        draft,
        version: stored.version,
        invalid: draft === null,
      };
    },
    save: (businessId, draft, expectedVersion) =>
      repository.save(businessId, draft, expectedVersion),
  };
}
