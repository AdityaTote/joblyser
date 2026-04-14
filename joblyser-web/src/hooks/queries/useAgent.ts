import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { AgentRunRequest } from "@/types/api";

export const useSessions = () => {
  return useQuery({
    queryKey: ["agent", "sessions"],
    queryFn: async () => {
      const res = await api.agent.getSessions();
      return res.data;
    },
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: ["agent", "session", id],
    queryFn: async () => {
      const res = await api.agent.getSession(id);
      const data = res.data as unknown;
      if (Array.isArray(data)) {
        return data[0] ?? null;
      }
      return data;
    },
    enabled: !!id && id !== "new",
  });
};

export const useSessionHistory = (id: string) => {
  return useQuery({
    queryKey: ["agent", "session-history", id],
    queryFn: async () => {
      const res = await api.agent.getSession(id);
      const data = res.data as unknown;
      if (Array.isArray(data)) return data;
      return data ? [data] : [];
    },
    enabled: !!id && id !== "new",
  });
};

export const useRunAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AgentRunRequest) => {
      const res = await api.agent.runAgent(data);
      return res.data;
    },
    onSuccess: (data, variables) => {
      // We don't necessarily want to invalidate immediately if it's a background job
      // but we can invalidate to show the 'pending' state if the session reflects it
      if (variables.session_id) {
        queryClient.invalidateQueries({ queryKey: ["agent", "session", variables.session_id] });
      }
      if (data.session_id) {
        queryClient.invalidateQueries({ queryKey: ["agent", "session", data.session_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["agent", "sessions"] });
    },
  });
};

export const useEditChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; sessionId: string; editedText: string }) => {
      const res = await api.agent.editChat(data.chatId, {
        session_id: data.sessionId,
        edited_text: data.editedText,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent", "session", variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["agent", "session-history", variables.sessionId] });
    },
  });
};

export const useJobStatus = (id: string | null) => {
  return useQuery({
    queryKey: ["agent", "job", id],
    queryFn: async () => {
      const res = await api.agent.getJob(id!);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = String(query.state.data?.status || "").toLowerCase();
      if (!status) return 5000;
      if (status === "complete" || status === "completed" || status === "failed") {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    // We want to stop refetching when the window is blurred? 
    // Usually TanStack Query does this by default or we can configure it.
  });
};

