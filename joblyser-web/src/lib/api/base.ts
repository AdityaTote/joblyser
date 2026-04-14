import axios, { AxiosInstance } from "axios";
import { useStore } from "@/store/useStore";

export class BaseService {
  protected client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      // Retrieve JWT directly from the persisted Zustand store
      const token = typeof window !== "undefined" ? useStore.getState().user?.access_token : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        if (response.status === 204) {
          return {} as any;
        }
        return response.data; // Now methods will return actual payload instead of AxiosResponse
      },
      (error) => {
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }
}
