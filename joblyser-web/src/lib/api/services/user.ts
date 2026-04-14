import { BaseService } from "../base";
import { User, ApiResponse } from "@/types/api";

export class UserService extends BaseService {
  async getMe(): Promise<ApiResponse<User>> {
    return this.client.get<any, ApiResponse<User>>("/users/me");
  }

  async updateProfile(profileId: string, data: Record<string, any>): Promise<ApiResponse<User>> {
    return this.client.patch<any, ApiResponse<User>>(`/users/me/profile/${profileId}`, data);
  }

  async setPrimaryResume(resume_key: string): Promise<ApiResponse<User>> {
    return this.client.patch<any, ApiResponse<User>>("/users/me/profile/resume-primary", { resume_key });
  }

  async deleteMe(): Promise<ApiResponse<void>> {
    return this.client.delete<any, ApiResponse<void>>("/users/me");
  }
}
