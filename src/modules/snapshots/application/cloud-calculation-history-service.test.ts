import { describe, expect, it, vi } from "vitest";
import { createCloudCalculationHistoryApplicationService } from "./cloud-calculation-history-service";

describe("cloud calculation history application service", () => {
  it("delegates cursor pagination without changing the cursor or page size", async () => {
    const firstPage = vi.fn(async () => ({
      records: [],
      cursor: { createdAt: "2026-11-03T12:00:00.000Z", id: "snapshot-1" },
      hasMore: true,
      invalidCount: 0,
    }));
    const nextPage = vi.fn(async () => ({
      records: [],
      cursor: null,
      hasMore: false,
      invalidCount: 0,
    }));
    const service = createCloudCalculationHistoryApplicationService({ firstPage, nextPage });
    const cursor = { createdAt: "2026-11-03T12:00:00.000Z", id: "snapshot-1" };
    await service.firstPage("business-1", 50);
    await service.nextPage("business-1", cursor, 50);
    expect(firstPage).toHaveBeenCalledWith("business-1", 50);
    expect(nextPage).toHaveBeenCalledWith("business-1", cursor, 50);
  });
});
