// import { Event, fetchEvents } from "../repository/events.repository";
// import { bulkInsertEvents, closePool } from "../repository/database.repository";

// const queue: any[] = [];
// const MAX_QUEUE_SIZE = 10;
// const PARALLEL_WORKERS = 3;
// let activeWorkers = 0;

// export async function ingestData(): Promise<void> {
//   let cursor: string | undefined = undefined;
//   let hasMore = true;

//   let lastLoopTime = Date.now();
//   let countInserted = 0;

//   try {
//     while (hasMore) {
//       while (queue?.length >= MAX_QUEUE_SIZE) {
//         await new Promise((r) => setTimeout(r, 50));
//       }

//       const { data, pagination } = await fetchEvents(cursor);

//       queue.push(data);
//       processQueue();

//       const loopEndTime = Date.now();
//       const loopDuration = ((loopEndTime - lastLoopTime) / 1000).toFixed(2);

//       countInserted += data?.length;

//       console.log(
//         `fetched_events:${data?.length}`,
//         `queue_size:${queue?.length}`,
//         `loop_duration_seconds:${loopDuration}`,
//       );

//       lastLoopTime = loopEndTime;
//       hasMore = pagination.hasMore;
//       cursor = pagination.nextCursor;
//     }

//     console.log(`total_events_ingested:${countInserted}`);
//   } catch (error) {
//     console.error("ingestion_failed:", error);
//     throw error;
//   } finally {
//     await closePool();
//   }
// }

import { fetchEvents } from "../repository/events.repository";
import { bulkInsertEvents } from "../repository/database.repository";
import * as fs from "fs";
import * as path from "path";

const PROGRESS_FILE = path.join(__dirname, "../../ingestion_progress.json");
const CONCURRENCY_LIMIT = 5;
const TOTAL_EVENTS = 3000000;
const LIMIT_PER_PAGE = 5000;
const TOTAL_PAGES = Math.ceil(TOTAL_EVENTS / LIMIT_PER_PAGE);

function saveProgress(page: number) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastProcessedPage: page }));
}

function loadProgress(): number {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    return data.lastProcessedPage || 0;
  }
  return 0;
}

export async function ingestData(): Promise<void> {
  const startPage = loadProgress() + 1;

  let activeRequests = 0;
  let currentPage = startPage;

  const processPage = async (page: number) => {
    try {
      const response = await fetchEvents(page);

      if (response.data && response.data.length > 0) {
        await bulkInsertEvents(response.data);
        saveProgress(page);
      }
    } catch (error) {
      // O erro será tratado pelo retry interno do fetchEvents,
      // se chegar aqui, a página falhou definitivamente.
    } finally {
      activeRequests--;
    }
  };

  while (currentPage <= TOTAL_PAGES) {
    if (activeRequests < CONCURRENCY_LIMIT) {
      activeRequests++;
      processPage(currentPage);
      currentPage++;
    }
  }

  while (activeRequests > 0) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// async function processQueue() {
//   if (queue.length === 0) return;
//   if (activeWorkers >= PARALLEL_WORKERS) return;

//   activeWorkers++;

//   const batch = queue.shift();

//   bulkInsertEvents(batch)
//     .catch((err) => {
//       console.error("bulk insert error", err);
//     })
//     .finally(() => {
//       activeWorkers--;
//       processQueue(); // tenta pegar o próximo
//     });
// }
