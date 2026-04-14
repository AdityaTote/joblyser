"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents", "list"],
    queryFn: async () => {
      const res = await api.document.getDocuments();
      return res.data;
    },
  });
};

export const useUploadDocument = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await api.document.createDocument(file);
      return res.data;
    },
  });
};
