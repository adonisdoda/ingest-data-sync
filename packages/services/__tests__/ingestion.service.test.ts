// import { ingestData } from "../ingestion.service";
// import * as eventsRepo from "../../repository/events.repository";
// import * as dbRepo from "../../repository/database.repository";
// import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// jest.mock("../../repository/events.repository");
// jest.mock("../../repository/database.repository");

// const mockFetchEvents = eventsRepo.fetchEvents as jest.MockedFunction<
//   typeof eventsRepo.fetchEvents
// >;
// const mockBulkInsertEvents = dbRepo.bulkInsertEvents as jest.MockedFunction<
//   typeof dbRepo.bulkInsertEvents
// >;
// const mockClosePool = dbRepo.closePool as jest.MockedFunction<
//   typeof dbRepo.closePool
// >;

// describe("ingestion.service", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockClosePool.mockResolvedValue();
//   });

//   describe("ingestData", () => {
//     it("should ingest all events successfully", async () => {
//       mockFetchEvents
//         .mockResolvedValueOnce({
//           data: [
//             {
//               id: "1",
//               sessionId: "session-1",
//               userId: "user-1",
//               type: "click",
//               name: "test1",
//               timestamp: 123,
//             },
//           ],
//           pagination: {
//             hasMore: true,
//             nextCursor: "cursor-1",
//             cursorExpiresIn: 3600,
//           },
//         })
//         .mockResolvedValueOnce({
//           data: [
//             {
//               id: "2",
//               sessionId: "session-2",
//               userId: "user-2",
//               type: "click",
//               name: "test2",
//               timestamp: 456,
//             },
//           ],
//           pagination: {
//             hasMore: false,
//             nextCursor: "",
//             cursorExpiresIn: 3600,
//           },
//         });

//       mockBulkInsertEvents.mockResolvedValue();

//       const consoleLogSpy = jest
//         .spyOn(console, "log")
//         .mockImplementation(() => undefined);

//       await ingestData();

//       expect(mockFetchEvents).toHaveBeenCalledTimes(2);
//       expect(mockFetchEvents).toHaveBeenNthCalledWith(1, undefined);
//       expect(mockFetchEvents).toHaveBeenNthCalledWith(2, "cursor-1");
//       expect(mockClosePool).toHaveBeenCalled();
//       expect(consoleLogSpy).toHaveBeenCalledWith(
//         expect.stringContaining("total_events_ingested:2")
//       );

//       consoleLogSpy.mockRestore();
//     });

//     it("should handle fetch error and close pool", async () => {
//       mockFetchEvents.mockRejectedValueOnce(new Error("API Error"));

//       const consoleErrorSpy = jest
//         .spyOn(console, "error")
//         .mockImplementation(() => undefined);

//       await expect(ingestData()).rejects.toThrow("API Error");

//       expect(mockClosePool).toHaveBeenCalled();

//       consoleErrorSpy.mockRestore();
//     });

//     it("should process events in queue when hasMore is true", async () => {
//       mockFetchEvents
//         .mockResolvedValueOnce({
//           data: Array(5000)
//             .fill(null)
//             .map((_, i) => ({
//               id: `id-${i}`,
//               sessionId: "session-1",
//               userId: "user-1",
//               type: "click",
//               name: "test",
//               timestamp: 123 + i,
//             })),
//           pagination: {
//             hasMore: false,
//             nextCursor: "",
//             cursorExpiresIn: 3600,
//           },
//         });

//       mockBulkInsertEvents.mockResolvedValue();

//       const consoleLogSpy = jest
//         .spyOn(console, "log")
//         .mockImplementation(() => undefined);

//       await ingestData();

//       expect(consoleLogSpy).toHaveBeenCalledWith(
//         expect.stringContaining("total_events_ingested:5000")
//       );

//       consoleLogSpy.mockRestore();
//     });

//     it("should always close pool even on success", async () => {
//       mockFetchEvents.mockResolvedValueOnce({
//         data: [],
//         pagination: {
//           hasMore: false,
//           nextCursor: "",
//           cursorExpiresIn: 3600,
//         },
//       });

//       mockBulkInsertEvents.mockResolvedValue();

//       await ingestData();

//       expect(mockClosePool).toHaveBeenCalledTimes(1);
//     });
//   });
// });
