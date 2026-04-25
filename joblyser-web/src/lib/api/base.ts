import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { useStore } from "@/store/useStore";

export class BaseService {
  protected client: AxiosInstance;

  protected getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return useStore.getState().user?.access_token ?? null;
  }

  protected getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        if (response.status === 204) {
          return {} as Record<string, never>;
        }
        return response.data; // Now methods will return actual payload instead of AxiosResponse
      },
      (error: { response?: { data?: unknown }; message?: string }) => {
        return Promise.reject(
          error.response?.data || error.message || "Request failed",
        );
      },
    );
  }
}
