import { Pool } from "pg";
import { bulkInsertEvents, closePool } from "../database.repository";
import { Event } from "../events.repository";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("pg", () => {
  const mockQuery = jest.fn();
  const mockRelease = jest.fn();
  const mockConnect = jest.fn<
    () => Promise<{ query: typeof mockQuery; release: typeof mockRelease }>
  >();

  return {
    Pool: jest.fn(() => ({
      connect: mockConnect.mockResolvedValue({
        query: mockQuery,
        release: mockRelease,
      }),
      end: jest.fn(),
    })),
  };
});

describe("database.repository", () => {
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);
  });

  describe("bulkInsertEvents", () => {
    it("should return early if events array is empty", async () => {
      await bulkInsertEvents([]);

      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it("should insert events successfully", async () => {
      const events: Event[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          sessionId: "session-1",
          userId: "user-1",
          type: "click",
          name: "button_click",
          timestamp: 1234567890,
          properties: { page: "/home" },
          session: { id: "session-1", deviceType: "mobile", browser: "Chrome" },
        },
      ];

      mockClient.query.mockResolvedValue({});

      await bulkInsertEvents(events);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO events"),
        expect.any(Array)
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should handle multiple batches", async () => {
      const events: Event[] = Array(2500)
        .fill(null)
        .map((_, i) => ({
          id: `id-${i}`,
          sessionId: "session-1",
          userId: "user-1",
          type: "click",
          name: "test",
          timestamp: 1234567890 + i,
        }));

      mockClient.query.mockResolvedValue({});

      await bulkInsertEvents(events);

      // BEGIN + 3 batches (1000, 1000, 500) + COMMIT
      expect(mockClient.query).toHaveBeenCalledTimes(5);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    it("should normalize string timestamp to number", async () => {
      const events: Event[] = [
        {
          id: "123",
          sessionId: "session-1",
          userId: "user-1",
          type: "click",
          name: "test",
          timestamp: "2024-01-01T00:00:00.000Z" as any,
        },
      ];

      mockClient.query.mockResolvedValue({});

      await bulkInsertEvents(events);

      const insertCall = mockClient.query.mock.calls.find(
        (call: any) => call[0].includes("INSERT INTO events")
      );

      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toContain(
        new Date("2024-01-01T00:00:00.000Z").getTime()
      );
    });

    it("should rollback on error", async () => {
      const events: Event[] = [
        {
          id: "123",
          sessionId: "session-1",
          userId: "user-1",
          type: "click",
          name: "test",
          timestamp: 1234567890,
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("Database error")); // INSERT fails

      await expect(bulkInsertEvents(events)).rejects.toThrow("Database error");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should handle null properties and session", async () => {
      const events: Event[] = [
        {
          id: "123",
          sessionId: "session-1",
          userId: "user-1",
          type: "click",
          name: "test",
          timestamp: 1234567890,
          properties: undefined,
          session: undefined,
        },
      ];

      mockClient.query.mockResolvedValue({});

      await bulkInsertEvents(events);

      const insertCall = mockClient.query.mock.calls.find(
        (call: any) => call[0].includes("INSERT INTO events")
      );

      expect(insertCall[1]).toContain(null); // properties should be null
      expect(insertCall[1]).toContain(null); // session should be null
    });
  });
});
