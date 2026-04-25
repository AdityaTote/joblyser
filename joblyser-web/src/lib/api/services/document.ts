import { BaseService } from "../base";
import { Document, ApiResponse, UploadedDocument } from "@/types/api";

export class DocumentService extends BaseService {
  async createDocument(file: File): Promise<ApiResponse<UploadedDocument>> {
    const formData = new FormData();
    formData.append("file", file);
    return this.client.post<
      ApiResponse<UploadedDocument>,
      ApiResponse<UploadedDocument>,
      FormData
    >("/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return this.client.get<ApiResponse<Document[]>, ApiResponse<Document[]>>(
      "/documents/",
    );
  }

  async getDocument(id: string): Promise<ApiResponse<Document>> {
    return this.client.get<ApiResponse<Document>, ApiResponse<Document>>(
      `/documents/${id}`,
    );
  }

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.client.delete<ApiResponse<void>, ApiResponse<void>>(
      `/documents/${id}`,
    );
  }
}
