import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { User } from "@/types/api";

export const useUser = () => {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await api.user.getMe();
      return res.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.user.updateProfile(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
};

export const useSetPrimaryResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resumeKey: string) => {
      const res = await api.user.setPrimaryResume(resumeKey);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
};
