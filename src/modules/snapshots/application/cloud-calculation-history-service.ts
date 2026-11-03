import type { PricingSnapshot } from "../domain/calculation-snapshot";
import type { SavedCalculation } from "../domain/saved-calculation";

export interface SnapshotCursor {
  createdAt: string;
  id: string;
}

export interface SnapshotPage {
  records: SavedCalculation[];
  cursor: SnapshotCursor | null;
  hasMore: boolean;
  invalidCount: number;
}

export interface CloudCalculationHistoryRepositoryPort {
  firstPage(businessId: string, pageSize?: number): Promise<SnapshotPage>;
  nextPage(businessId: string, cursor: SnapshotCursor, pageSize?: number): Promise<SnapshotPage>;
  saveSnapshot(businessId: string, snapshot: PricingSnapshot): Promise<SavedCalculation>;
}

export interface CloudCalculationHistoryApplicationService {
  firstPage(businessId: string, pageSize?: number): Promise<SnapshotPage>;
  nextPage(businessId: string, cursor: SnapshotCursor, pageSize?: number): Promise<SnapshotPage>;
  saveSnapshot(businessId: string, snapshot: PricingSnapshot): Promise<SavedCalculation>;
}

export function createCloudCalculationHistoryApplicationService(
  repository: CloudCalculationHistoryRepositoryPort,
): CloudCalculationHistoryApplicationService {
  return {
    firstPage: (businessId, pageSize) => repository.firstPage(businessId, pageSize),
    nextPage: (businessId, cursor, pageSize) => repository.nextPage(businessId, cursor, pageSize),
    saveSnapshot: (businessId, snapshot) => repository.saveSnapshot(businessId, snapshot),
  };
}
