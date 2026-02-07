// DataSync API Ingestion - Entry Point
import { ingestData } from "./services/ingestion.service";
import { fetchEvents } from "./repository/events.repository";

if (require.main === module) {
  console.log("Starting ingestion...");
  ingestData()
    .then(() => {
      console.log("ingestion_complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("ingestion_failed:", error);
      process.exit(1);
    });
}

export { fetchEvents, ingestData };
