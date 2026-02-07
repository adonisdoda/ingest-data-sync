import fetch from "node-fetch";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchEvents } from "../events.repository";

jest.mock("node-fetch");
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("events.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchEvents", () => {
    it("should fetch events successfully without cursor", async () => {
      const mockResponse = {
        data: [
          {
            id: "123",
            sessionId: "session-1",
            userId: "user-1",
            type: "click",
            name: "button_click",
            timestamp: 1234567890,
          },
        ],
        pagination: {
          hasMore: false,
          nextCursor: "",
          cursorExpiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await fetchEvents();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=5000"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-API-Key": expect.any(String),
          }),
        })
      );
    });

    it("should fetch events with cursor", async () => {
      const mockResponse = {
        data: [],
        pagination: {
          hasMore: true,
          nextCursor: "next-cursor",
          cursorExpiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await fetchEvents("test-cursor");

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("cursor=test-cursor"),
        expect.any(Object)
      );
    });

  });
});
