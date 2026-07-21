import { BaseService } from "../base";
import { AuthResponse, ApiResponse, User } from "@/types";

export class AuthService extends BaseService {
  async signup(
    data: Record<string, unknown>,
  ): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<
      ApiResponse<AuthResponse>,
      ApiResponse<AuthResponse>,
      Record<string, unknown>
    >("/auth/signup", data);
  }

  async signin(
    data: Record<string, unknown>,
  ): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<
      ApiResponse<AuthResponse>,
      ApiResponse<AuthResponse>,
      Record<string, unknown>
    >("/auth/signin", data);
  }

  async getGoogleUrl(): Promise<ApiResponse<{ url: string }>> {
    return this.client.get<
      ApiResponse<{ url: string }>,
      ApiResponse<{ url: string }>
    >("/auth/google");
  }

  async me(): Promise<ApiResponse<User>> {
    return this.client.get<ApiResponse<User>, ApiResponse<User>>("/auth/me");
  }
}
