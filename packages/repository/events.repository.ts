import { URL } from "url";
import fetch from "node-fetch";

const API_BASE_URL =
  "http://datasync-dev-alb-101078500.us-east-1.elb.amazonaws.com/api/v1";

const API_KEY = "ds_086cfa60c0c2a3df470fe85084780c07";

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
    limit?: number;
    cursorExpiresIn?: number;
  };
  meta?: {
    total?: number;
    returned?: number;
    requestId?: string;
  };
}

export async function fetchEvents(
  cursor?: string,
  limit: number = 5000,
): Promise<ApiResponse> {
  const url = new URL(`${API_BASE_URL}/events`);

  if (cursor) {
    url.searchParams.append("cursor", cursor);
  }
  
  url.searchParams.append("limit", limit.toString());

  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        const retryAfter =
          parseInt(response.headers.get("Retry-After") || "10") * 1000;

        console.log(`Rate limit - aguardando ${retryAfter}ms`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error - Status: ${response.status}`);
        console.error(`Response:`, errorBody);

        if (attempt < maxRetries) {
          const waitTime = 2000 * attempt;
          console.log(`Retry ${attempt}/${maxRetries} em ${waitTime}ms`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(
          `Erro na API (Status ${response.status}) após ${maxRetries} tentativas`,
        );
      }

      return (await response.json()) as ApiResponse;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === "AbortError") {
        console.error(
          `Timeout na requisição (tentativa ${attempt}/${maxRetries})`,
        );
      } else {
        console.error(`Erro na requisição:`, error.message);
      }

      if (attempt < maxRetries) {
        const waitTime = 2000 * attempt;
        console.log(`Tentando novamente em ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }

  throw new Error("failure_after_retries");
}
