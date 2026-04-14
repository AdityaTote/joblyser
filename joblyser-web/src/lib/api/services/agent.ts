import { BaseService } from "../base";
import { 
  SessionsResponse, 
  SessionResponse, 
  JobStatusResponse, 
  RunAgentResponse, 
  RagRetrievalRequest, 
  AgentRunRequest,
  EditChatRequest,
  ApiResponse
} from "@/types/api";

export class AgentService extends BaseService {
  async getSessions(): Promise<ApiResponse<SessionsResponse[]>> {
    return this.client.get<any, ApiResponse<SessionsResponse[]>>("/agent/sessions");
  }

  async getSession(id: string): Promise<ApiResponse<SessionResponse>> {
    return this.client.get<any, ApiResponse<SessionResponse>>(`/agent/sessions/${id}`);
  }

  async getJob(id: string): Promise<ApiResponse<JobStatusResponse>> {
    return this.client.get<any, ApiResponse<JobStatusResponse>>(`/agent/jobs/${id}`);
  }

  async ragRetrieval(data: RagRetrievalRequest): Promise<ApiResponse<any>> {
    return this.client.post<any, ApiResponse<any>>("/agent/rag/retrieval", data);
  }

  async runAgent(data: AgentRunRequest): Promise<ApiResponse<RunAgentResponse>> {
    return this.client.post<any, ApiResponse<RunAgentResponse>>("/agent/run", data);
  }

  async editChat(chatId: string, data: EditChatRequest): Promise<ApiResponse<SessionResponse>> {
    return this.client.patch<any, ApiResponse<SessionResponse>>(`/agent/chats/${chatId}/edit`, data);
  }
}
