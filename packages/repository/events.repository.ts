import { URL } from "url";
import fetch from "node-fetch";

const API_BASE_URL =
  "http://datasync-dev-alb-101078500.us-east-1.elb.amazonaws.com/api/v1";

const API_KEY = "ds_be6f40b6af0443561eb641a1dc37338d";

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
        "X-API-Key": API_KEY,
        "X-Cache-Enabled": "true",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (attempt < maxRetries) {
        const waitTime = 11000;

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
    }
    return await response.json();
  }

  return Promise.reject(new Error("retry_failed"));
}
