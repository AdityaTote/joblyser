import { BaseService } from "../base";
import { User, ApiResponse } from "@/types";

export class UserService extends BaseService {
  async getMe(): Promise<ApiResponse<User>> {
    return this.client.get<ApiResponse<User>, ApiResponse<User>>("/users/me");
  }

  async updateProfile(
    profileId: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<User>> {
    return this.client.patch<
      ApiResponse<User>,
      ApiResponse<User>,
      Record<string, unknown>
    >(`/users/me/profile/${profileId}`, data);
  }

  async setPrimaryResume(resume_key: string): Promise<ApiResponse<User>> {
    return this.client.patch<
      ApiResponse<User>,
      ApiResponse<User>,
      { resume_key: string }
    >("/users/me/profile/resume-primary", { resume_key });
  }

  async deleteMe(): Promise<ApiResponse<void>> {
    return this.client.delete<ApiResponse<void>, ApiResponse<void>>(
      "/users/me",
    );
  }
}
