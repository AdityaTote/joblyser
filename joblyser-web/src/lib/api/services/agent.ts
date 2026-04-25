import { BaseService } from "../base";
import {
  SessionsResponse,
  SessionResponse,
  JobStatusEventResponse,
  RunAgentResponse,
  RagRetrievalRequest,
  AgentRunRequest,
  EditChatRequest,
  ApiResponse,
} from "@/types/api";

export class AgentService extends BaseService {
  constructor(baseURL: string) {
    super(baseURL);
    this.client.defaults.headers.common["X-Service-Name"] = "auth";
  }

  async getSessions(): Promise<ApiResponse<SessionsResponse[]>> {
    return this.client.get<
      ApiResponse<SessionsResponse[]>,
      ApiResponse<SessionsResponse[]>
    >("/agent/sessions");
  }

  async getSession(id: string): Promise<ApiResponse<SessionResponse>> {
    return this.client.get<
      ApiResponse<SessionResponse>,
      ApiResponse<SessionResponse>
    >(`/agent/sessions/${id}`);
  }

  async streamJobStatus(
    jobId: string,
    signal?: AbortSignal,
  ): Promise<JobStatusEventResponse> {
    const baseURL = this.client.defaults.baseURL;
    if (!baseURL) {
      throw new Error("AI API base URL is not configured");
    }

    const normalizedBaseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    const streamURL = new URL(
      `agent/status/${encodeURIComponent(jobId)}`,
      normalizedBaseURL,
    ).toString();

    const response = await fetch(streamURL, {
      method: "GET",
      signal,
      headers: {
        Accept: "text/event-stream",
        "X-Service-Name": "auth",
        ...this.getAuthHeaders(),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `Failed to stream job status (${response.status})`;

      try {
        const payload = (await response.json()) as {
          detail?: string | { message?: string };
        };

        if (typeof payload.detail === "string" && payload.detail.trim()) {
          message = payload.detail;
        }

        if (
          payload.detail &&
          typeof payload.detail === "object" &&
          typeof payload.detail.message === "string" &&
          payload.detail.message.trim()
        ) {
          message = payload.detail.message;
        }
      } catch {
        // Best effort parsing only; fallback message is already set.
      }

      throw new Error(message);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("SSE stream is unavailable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const normalized = buffer.replace(/\r\n/g, "\n");
      const events = normalized.split("\n\n");
      buffer = events.pop() || "";

      for (const eventChunk of events) {
        const lines = eventChunk
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const dataLine = lines.find((line) => line.startsWith("data:"));
        if (!dataLine) {
          continue;
        }

        const payload = dataLine.slice(5).trim();
        if (!payload) {
          continue;
        }

        return JSON.parse(payload) as JobStatusEventResponse;
      }
    }

    throw new Error("No job status event received");
  }

  async ragRetrieval(data: RagRetrievalRequest): Promise<ApiResponse<unknown>> {
    return this.client.post<
      ApiResponse<unknown>,
      ApiResponse<unknown>,
      RagRetrievalRequest
    >("/rag/retrieval", data);
  }

  async runAgent(
    data: AgentRunRequest,
  ): Promise<ApiResponse<RunAgentResponse>> {
    return this.client.post<
      ApiResponse<RunAgentResponse>,
      ApiResponse<RunAgentResponse>,
      AgentRunRequest
    >("/agent/run", data);
  }

  async editChat(
    chatId: string,
    data: EditChatRequest,
  ): Promise<ApiResponse<SessionResponse>> {
    return this.client.patch<
      ApiResponse<SessionResponse>,
      ApiResponse<SessionResponse>,
      EditChatRequest
    >(`/agent/chats/${chatId}/edit`, data);
  }
}
