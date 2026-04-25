"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/error";
import {
  AgentRunRequest,
  JobStatusEventResponse,
  RagRetrievalRequest,
  RunAgentResponse,
  SessionResponse,
  SessionsResponse,
} from "@/types/api";

export function useSessions() {
  return useQuery<SessionsResponse[], Error>({
    queryKey: ["agent", "sessions"],
    queryFn: async () => {
      try {
        const response = await aiApi.agent.getSessions();
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch sessions"),
        );
      }
    },
  });
}

export function useSession(id: string) {
  return useQuery<SessionResponse | null, Error>({
    queryKey: ["agent", "session", id],
    queryFn: async () => {
      try {
        const response = await aiApi.agent.getSession(id);
        const data = response.data as unknown;

        if (Array.isArray(data)) {
          return (data[0] as SessionResponse | undefined) ?? null;
        }

        return data as SessionResponse;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch session"),
        );
      }
    },
    enabled: Boolean(id) && id !== "new",
  });
}

export function useSessionHistory(id: string) {
  return useQuery<SessionResponse[], Error>({
    queryKey: ["agent", "session-history", id],
    queryFn: async () => {
      try {
        const response = await aiApi.agent.getSession(id);
        const data = response.data as unknown;

        if (Array.isArray(data)) {
          return data as SessionResponse[];
        }

        return data ? [data as SessionResponse] : [];
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch session history"),
        );
      }
    },
    enabled: Boolean(id) && id !== "new",
  });
}

export function useRunAgent() {
  const queryClient = useQueryClient();

  return useMutation<RunAgentResponse, Error, AgentRunRequest>({
    mutationFn: async (data) => {
      try {
        const response = await aiApi.agent.runAgent(data);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to run AI analysis"),
        );
      }
    },
    onSuccess: (data, variables) => {
      if (variables.session_id) {
        queryClient.invalidateQueries({
          queryKey: ["agent", "session", variables.session_id],
        });
      }

      if (data.session_id) {
        queryClient.invalidateQueries({
          queryKey: ["agent", "session", data.session_id],
        });
        queryClient.invalidateQueries({
          queryKey: ["agent", "session-history", data.session_id],
        });
      }

      queryClient.invalidateQueries({ queryKey: ["agent", "sessions"] });
    },
  });
}

export function useEditChat() {
  const queryClient = useQueryClient();

  return useMutation<
    SessionResponse,
    Error,
    { chatId: string; sessionId: string; editedText: string }
  >({
    mutationFn: async (data) => {
      try {
        const response = await aiApi.agent.editChat(data.chatId, {
          session_id: data.sessionId,
          edited_text: data.editedText,
        });
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to save edited output"),
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["agent", "session", variables.sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent", "session-history", variables.sessionId],
      });
    },
  });
}

export function useJobStatus(id: string | null) {
  return useQuery<JobStatusEventResponse, Error>({
    queryKey: ["agent", "job", id],
    queryFn: async ({ signal }) => {
      try {
        return await aiApi.agent.streamJobStatus(id as string, signal);
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to stream job status"),
        );
      }
    },
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (query) => {
      const status = String(query.state.data?.status || "").toLowerCase();

      if (!status) {
        return false;
      }

      if (
        status === "complete" ||
        status === "completed" ||
        status === "failed"
      ) {
        return false;
      }

      return 150;
    },
    refetchIntervalInBackground: true,
  });
}

export function useRagRetrieval() {
  return useMutation<unknown, Error, RagRetrievalRequest>({
    mutationFn: async (data) => {
      try {
        const response = await aiApi.agent.ragRetrieval(data);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(
            error,
            "Failed to retrieve context from resume",
          ),
        );
      }
    },
  });
}
