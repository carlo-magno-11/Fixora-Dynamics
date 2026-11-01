import { createPricingSnapshot } from "../domain/calculation-snapshot";
import type {
  CreatePricingSnapshotInput,
  PricingSnapshot,
} from "../domain/calculation-snapshot";

export type PricingSnapshotCommand = Omit<CreatePricingSnapshotInput, "id" | "createdAt">;

export interface SnapshotRuntime {
  generateId(): string;
  now(): string;
}

export interface SnapshotApplicationService {
  create(input: PricingSnapshotCommand): PricingSnapshot;
}

export function createSnapshotApplicationService(
  runtime: SnapshotRuntime,
): SnapshotApplicationService {
  return {
    create(input) {
      return createPricingSnapshot({
        ...input,
        id: runtime.generateId(),
        createdAt: runtime.now(),
      });
    },
  };
}
