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
  properties: Record<string, any>;
  timestamp: number;
}

export interface ApiResponse {
  data: Event[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

// export async function fetchEvents(cursor?: string, page?: number): Promise<ApiResponse> {
//   let url = new URL(`${API_BASE_URL}/events`);

//   if (cursor) {
//     url.searchParams.append("cursor", cursor);
//   }

//   url.searchParams.append("limit", "5000");

//   const maxRetries = 3;

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     const response = await fetch(url.toString(), {
//       method: "GET",
//       headers: {
//         "X-API-Key": API_KEY,
//         "X-Cache-Enabled": "true",
//         "X-Enable-Parallel": "true",
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       if (attempt < maxRetries) {
//         const waitTime = 11000;

//         await new Promise((resolve) => setTimeout(resolve, waitTime));
//         continue;
//       }
//     }
//     return await response.json();
//   }

//   return Promise.reject(new Error("retry_failed"));
// }

export async function fetchEvents(
  page: number,
  limit: number = 5000,
): Promise<ApiResponse> {
  const url = new URL(`${API_BASE_URL}/events`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());

  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "X-Enable-Parallel": "true",
        "X-Cache-Enabled": "true",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "10",
      ) * 1000;

      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      continue;
    }

    if (!response.ok) {
      if (attempt < maxRetries) {
        const waitTime = 2000 * attempt;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw new Error(
        `Erro na API (Status ${response.status}) após ${maxRetries} tentativas`,
      );
    }

    return await response.json() as ApiResponse;
  }

  throw new Error("Falha ao buscar eventos após retries.");
}
