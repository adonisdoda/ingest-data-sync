import { URL } from "url";
import fetch from "node-fetch";

const API_BASE_URL = process.env.API_BASE_URL;

const API_KEY = process.env.API_KEY;

export interface Event {
  id: string;
  sessionId: string;
  userId: string;
  type: string;
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  session?: {
    id: string;
    deviceType: string;
    browser: string;
  };
}

export interface ApiResponse {
  data: Event[];
  pagination: { hasMore: boolean; nextCursor: string; cursorExpiresIn: number };
  nextCursor?: string;
}

export async function fetchEvents(cursor?: string): Promise<ApiResponse> {
  let url = new URL(`${API_BASE_URL}/events`);

  if (cursor) {
    url.searchParams.append("cursor", cursor);
  }

  url.searchParams.append("limit", "5000");

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY as string,
        // "X-Cache-Enabled": "true",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `API Error - Status: ${response.status} ${response.statusText}`,
      );
      console.error(`Response Body:`, errorBody);
      console.error(`Attempt: ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        const waitTime = 11000;
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
    }
    return await response.json();
  }

  console.error("All retry attempts failed!");
  return Promise.reject(new Error("retry_failed"));
}
