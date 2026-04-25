import { AuthService } from "./services/auth";
import { UserService } from "./services/user";
import { DocumentService } from "./services/document";
import { AgentService } from "./services/agent";

export class ApiClient {
  public auth: AuthService;
  public user: UserService;
  public document: DocumentService;

  constructor(baseURL: string) {
    this.auth = new AuthService(baseURL);
    this.user = new UserService(baseURL);
    this.document = new DocumentService(baseURL);
  }
}

export class AiApiClient {
  public agent: AgentService;

  constructor(baseURL: string) {
    this.agent = new AgentService(baseURL);
  }
}

// Ensure the NEXT_PUBLIC_API_URL has /api/v1 appended if it's just the host
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8080/api/v1";

export const api = new ApiClient(API_URL);
export const aiApi = new AiApiClient(AI_API_URL);
