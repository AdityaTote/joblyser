"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/error";
import { AuthResponse } from "@/types/api";
import { useStore } from "@/store/useStore";

type AuthPayload = Record<string, unknown>;

function mapAuthUser(data: AuthResponse) {
  return {
    id: data.userId,
    email: data.email,
    access_token: data.token,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function useSignIn() {
  const { setUser } = useStore();
  const router = useRouter();

  return useMutation<AuthResponse, Error, AuthPayload>({
    mutationFn: async (data) => {
      try {
        const response = await api.auth.signin(data);
        return response.data;
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, "Failed to sign in"));
      }
    },
    onSuccess: (data) => {
      setUser(mapAuthUser(data));
      router.push("/dashboard");
    },
  });
}

export function useSignUp() {
  const { setUser } = useStore();
  const router = useRouter();

  return useMutation<AuthResponse, Error, AuthPayload>({
    mutationFn: async (data) => {
      try {
        const response = await api.auth.signup(data);
        return response.data;
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, "Failed to sign up"));
      }
    },
    onSuccess: (data) => {
      setUser(mapAuthUser(data));
      router.push("/dashboard");
    },
  });
}

export function useGoogleUrl() {
  return useMutation<{ url: string }, Error, void>({
    mutationFn: async () => {
      try {
        const response = await api.auth.getGoogleUrl();
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to get Google login URL"),
        );
      }
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}
