import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export const useSignIn = () => {
  const { setUser } = useStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.auth.signin(data);
      return res.data;
    },
    onSuccess: (data) => {
      setUser({
        id: data.userId,
        email: data.email,
        access_token: data.token,
        created_at: new Date().toISOString(), // Fallback if not in AuthResponse
        updated_at: new Date().toISOString(),
      });
      router.push("/new");
    },
  });
};

export const useSignUp = () => {
  const { setUser } = useStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.auth.signup(data);
      return res.data;
    },
    onSuccess: (data) => {
      setUser({
        id: data.userId,
        email: data.email,
        access_token: data.token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      router.push("/new");
    },
  });
};

export const useGoogleUrl = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await api.auth.getGoogleUrl();
      return res.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
