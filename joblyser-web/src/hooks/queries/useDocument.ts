"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/error";
import { Document, UploadedDocument } from "@/types";

export function useDocuments() {
  return useQuery<Document[], Error>({
    queryKey: ["documents", "list"],
    queryFn: async () => {
      try {
        const response = await api.document.getDocuments();
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch documents"),
        );
      }
    },
  });
}

export function useDocument(id: string) {
  return useQuery<Document, Error>({
    queryKey: ["documents", "single", id],
    queryFn: async () => {
      try {
        const response = await api.document.getDocument(id);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch document"),
        );
      }
    },
    enabled: Boolean(id),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<UploadedDocument, Error, File>({
    mutationFn: async (file) => {
      try {
        const response = await api.document.createDocument(file);
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to upload document"),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await api.document.deleteDocument(id);
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to delete document"),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}
