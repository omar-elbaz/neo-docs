import { z } from "zod";

// API configuration and client
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Zod schemas - matching backend exactly
export const LoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address (e.g., user@example.com)"),
  password: z.string().min(1),
});

export const RegisterSchema = LoginSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
});

export const RegisterResponseSchema = z.object({
  token: z.string(),
});

export const MeResponseSchema = z.object({
  userID: z.string(),
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
});

// Document schemas - matching backend exactly
export const CreateDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  isShared: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const DocumentResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.any().nullable(), // JSON content from TipTap editor
  filePath: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  isShared: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  createdAt: z.string(), // Backend returns as string
  updatedAt: z.string(), // Backend returns as string
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    email: z.string(),
  }).optional(),
  lastEditor: z.object({
    id: z.string(),
    email: z.string(),
  }).nullable().optional(), // Can be null
  shares: z.array(z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
    }),
    permission: z.string(),
  })).optional().default([]), // Default to empty array
});

export const DeleteDocumentResponseSchema = z.object({
  success: z.boolean(),
});

export const ShareDocumentSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['READ', 'WRITE', 'ADMIN']),
});

export const ShareDocumentResponseSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  userId: z.string(),
  permission: z.enum(['READ', 'WRITE', 'ADMIN']),
  users: z.object({
    id: z.string(),
    email: z.string(),
  }),
});

// Type exports - matching backend exactly
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type CreateDocumentRequest = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type DeleteDocumentResponse = z.infer<
  typeof DeleteDocumentResponseSchema
>;
export type ShareDocumentRequest = z.infer<typeof ShareDocumentSchema>;
export type ShareDocumentResponse = z.infer<typeof ShareDocumentResponseSchema>;

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    responseSchema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Validate response with Zod if schema provided
      if (responseSchema) {
        try {
          const validatedData = responseSchema.parse(data);
          return { data: validatedData };
        } catch (validationError) {
          return {
            error: `Invalid response format: ${
              validationError instanceof Error
                ? validationError.message
                : "Unknown error"
            }`,
          };
        }
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Auth endpoints - matching backend routes exactly
  async login(email: string, password: string) {
    const requestData = LoginSchema.parse({ email, password });

    return this.request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(requestData),
      },
      LoginResponseSchema
    );
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const requestData = RegisterSchema.parse({ email, password, firstName, lastName });

    return this.request<RegisterResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(requestData),
      },
      RegisterResponseSchema
    );
  }

  async getCurrentUser() {
    return this.request<MeResponse>("/auth/me", {}, MeResponseSchema);
  }

  // Document endpoints - matching backend routes exactly
  async getDocuments() {
    return this.request<DocumentResponse[]>(
      "/documents",
      {},
      z.array(DocumentResponseSchema)
    );
  }

  async getDocument(id: string) {
    return this.request<DocumentResponse>(
      `/documents/${id}`,
      {},
      DocumentResponseSchema
    );
  }

  async createDocument(data: CreateDocumentRequest) {
    const requestData = CreateDocumentSchema.parse(data);

    return this.request<DocumentResponse>(
      "/documents",
      {
        method: "POST",
        body: JSON.stringify(requestData),
      },
      DocumentResponseSchema
    );
  }

  async updateDocument(id: string, data: UpdateDocumentRequest) {
    const requestData = UpdateDocumentSchema.parse(data);

    return this.request<DocumentResponse>(
      `/documents/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(requestData),
      },
      DocumentResponseSchema
    );
  }

  async deleteDocument(id: string) {
    return this.request<DeleteDocumentResponse>(
      `/documents/${id}`,
      {
        method: "DELETE",
      },
      DeleteDocumentResponseSchema
    );
  }

  async shareDocument(id: string, data: ShareDocumentRequest) {
    const requestData = ShareDocumentSchema.parse(data);

    return this.request<ShareDocumentResponse>(
      `/documents/${id}/share`,
      {
        method: "POST",
        body: JSON.stringify(requestData),
      },
      ShareDocumentResponseSchema
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
