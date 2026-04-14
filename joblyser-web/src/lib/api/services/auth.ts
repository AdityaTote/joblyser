import { BaseService } from "../base";
import { AuthResponse, ApiResponse } from "@/types/api";

export class AuthService extends BaseService {
  async signup(data: Record<string, any>): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<any, ApiResponse<AuthResponse>>("/auth/signup", data);
  }

  async signin(data: Record<string, any>): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<any, ApiResponse<AuthResponse>>("/auth/signin", data);
  }

  async getGoogleUrl(): Promise<ApiResponse<{ url: string }>> {
    return this.client.get<any, ApiResponse<{ url: string }>>("/auth/google");
  }
}
