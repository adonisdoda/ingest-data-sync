import { fetchEvents } from "../repository/events.repository";
import { bulkInsertEvents } from "../repository/database.repository";
import * as fs from "fs";
import * as path from "path";

const PROGRESS_FILE = path.join(__dirname, "../../ingestion_progress.json");
const LIMIT_PER_REQUEST = 5000;

function saveProgress(cursor: string, totalInserted: number) {
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ lastCursor: cursor, totalInserted })
  );
}

function loadProgress(): { cursor?: string; totalInserted: number } {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    return {
      cursor: data.lastCursor,
      totalInserted: data.totalInserted || 0,
    };
  }
  return { totalInserted: 0 };
}

export async function ingestData(): Promise<void> {
  const progress = loadProgress();
  const startTime = Date.now();

  let cursor = progress.cursor;
  let hasMore = true;
  let totalInserted = progress.totalInserted;
  let requestCount = 0;

  console.log(`Iniciando ingestão... Total já inserido: ${totalInserted}`);

  while (hasMore) {
    const requestStartTime = Date.now();
    requestCount++;

    try {
      const response = await fetchEvents(cursor, LIMIT_PER_REQUEST);

      if (response.data && response.data.length > 0) {
        await bulkInsertEvents(response.data);

        totalInserted += response.data.length;
        const requestTime = ((Date.now() - requestStartTime) / 1000).toFixed(2);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const eventsPerSec = (totalInserted / (Date.now() - startTime) * 1000).toFixed(2);

        console.log(
          `[Req ${requestCount}] ` +
            `${response.data.length} eventos | ` +
            `Tempo: ${requestTime}s | ` +
            `Total: ${totalInserted} | ` +
            `Vazão: ${eventsPerSec} ev/s | ` +
            `Elapsed: ${elapsedTime}s`
        );
      }

      hasMore = response.pagination.hasMore;
      cursor = response.pagination.nextCursor;

      if (cursor) {
        saveProgress(cursor, totalInserted);
      }
    } catch (error) {
      console.error(`Erro na requisição ${requestCount}:`, error);
      throw error;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Ingestão completa!`);
  console.log(`Total de eventos: ${totalInserted}`);
  console.log(`Tempo total: ${totalTime}s`);
  console.log(`Vazão média: ${(totalInserted / parseFloat(totalTime)).toFixed(2)} eventos/s`);
}