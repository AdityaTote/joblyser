import { BaseService } from "../base";
import { Document, ApiResponse, UploadedDocument } from "@/types/api";

export class DocumentService extends BaseService {
  async createDocument(file: File): Promise<ApiResponse<UploadedDocument>> {
    const formData = new FormData();
    formData.append("file", file);
    return this.client.post<any, ApiResponse<UploadedDocument>>("/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return this.client.get<any, ApiResponse<Document[]>>("/documents/");
  }

  async getDocument(id: string): Promise<ApiResponse<Document>> {
    return this.client.get<any, ApiResponse<Document>>(`/documents/${id}`);
  }

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.client.delete<any, ApiResponse<void>>(`/documents/${id}`);
  }
}
