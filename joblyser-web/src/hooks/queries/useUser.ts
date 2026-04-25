"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/error";
import { User } from "@/types/api";

export function useUser() {
  return useQuery<User, Error>({
    queryKey: ["user", "me"],
    queryFn: async () => {
      try {
        const response = await api.user.getMe();
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to load user profile"),
        );
      }
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    Error,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await api.user.updateProfile(id, data);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to update profile"),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

export function useSetPrimaryResume() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: async (resumeKey) => {
      try {
        const response = await api.user.setPrimaryResume(resumeKey);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to set primary resume"),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
    },
  });
}

export function useDeleteMe() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await api.user.deleteMe();
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to delete user account"),
        );
      }
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
