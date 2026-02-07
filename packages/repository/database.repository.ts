import { Pool } from "pg";
import { Event } from "./events.repository";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function bulkInsertEvents(events: Event[]): Promise<void> {
  if (events.length === 0) {
    return;
  }

  const BATCH_SIZE = 1000;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((event, index) => {
        const baseIndex = index * 8;

        placeholders.push(
          `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
            baseIndex + 4
          }, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${
            baseIndex + 8
          })`,
        );

        values.push(
          event.id,
          event.name,
          event.type,
          event.userId,
          event.sessionId,
          event.properties ? JSON.stringify(event.properties) : null,
          event.sessionId ? JSON.stringify(event.sessionId) : null,
          typeof event.timestamp === "string"
            ? new Date(event.timestamp).getTime()
            : event.timestamp,
        );
      });

      const query = `
        INSERT INTO events (id, name, type, user_id, session_id, properties, session, timestamp)
        VALUES ${placeholders.join(", ")} ON CONFLICT DO NOTHING
      `;

      await client.query(query, values);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
