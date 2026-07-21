"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/error";
import { AuthResponse, User } from "@/types";
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
      router.push("/new");
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
      router.push("/new");
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

export function useMe(enabled: boolean = true) {
  const updateUser = useStore((s) => s.updateUser);

  const query = useQuery<User, Error>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const response = await api.auth.me();
        return response.data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "Failed to fetch current user"),
        );
      }
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Merge fetched fields into Zustand store without overwriting the token
  useEffect(() => {
    if (query.data) {
      updateUser(query.data);
    }
  }, [query.data, updateUser]);

  return query;
}


