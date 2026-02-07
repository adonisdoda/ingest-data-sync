import { Event, fetchEvents } from "../repository/events.repository";
import { bulkInsertEvents, closePool } from "../repository/database.repository";

const queue: any[] = [];
const MAX_QUEUE_SIZE = 10;
const PARALLEL_WORKERS = 3;
let activeWorkers = 0;

export async function ingestData(): Promise<void> {
  let cursor: string | undefined = undefined;
  let hasMore = true;

  let lastLoopTime = Date.now();
  let countInserted = 0;

  try {
    while (hasMore) {
      while (queue?.length >= MAX_QUEUE_SIZE) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const { data, pagination } = await fetchEvents(cursor);

      queue.push(data);
      processQueue();

      const loopEndTime = Date.now();
      const loopDuration = ((loopEndTime - lastLoopTime) / 1000).toFixed(2);

      countInserted += data?.length;

      console.log(
        `fetched_events:${data?.length}`,
        `queue_size:${queue?.length}`,
        `loop_duration_seconds:${loopDuration}`,
      );

      lastLoopTime = loopEndTime;
      hasMore = pagination.hasMore;
      cursor = pagination.nextCursor;
    }

    console.log(`total_events_ingested:${countInserted}`);
  } catch (error) {
    console.error("ingestion_failed:", error);
    throw error;
  } finally {
    await closePool();
  }
}

async function processQueue() {
  if (queue.length === 0) return;
  if (activeWorkers >= PARALLEL_WORKERS) return;

  activeWorkers++;

  const batch = queue.shift();

  bulkInsertEvents(batch)
    .catch((err) => {
      console.error("bulk insert error", err);
    })
    .finally(() => {
      activeWorkers--;
      processQueue(); // tenta pegar o próximo
    });
}
