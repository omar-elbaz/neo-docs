import { z } from "zod";

// JWT and Authentication Schemas
export const JwtPayloadSchema = z.object({
  id: z.string(),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address (e.g., user@example.com)"),
  password: z.string().min(1),
});

export const RegisterSchema = LoginSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Document Schemas
export const CreateDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.any().optional(), // JSON content for rich text
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.any().optional(), // JSON content for rich text
  isShared: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  revisionId: z.string().optional(),
});

// Document sharing schema
export const ShareDocumentSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['READ', 'WRITE', 'ADMIN']),
});

// User Schemas
export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
});

// Response Schemas
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const DocumentResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  filePath: z.string().nullable(),
  fileSize: z.number().nullable(),
  isShared: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  authorId: z.string(),
});

// Type exports
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type CreateDocumentRequest = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentSchema>;
export type ShareDocumentRequest = z.infer<typeof ShareDocumentSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
