import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "neo-docs-storage";
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Generate S3 file path for document
   */
  generateFilePath(documentId: string, version: number = 1): string {
    return `documents/${documentId}/v${version}.json`;
  }

  /**
   * Upload document content to S3
   */
  async uploadDocument(documentId: string, content: any, version: number = 1): Promise<string> {
    const filePath = this.generateFilePath(documentId, version);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: JSON.stringify(content),
        ContentType: "application/json",
        Metadata: {
          documentId,
          version: version.toString(),
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);
      console.log(`Document uploaded to S3: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error("Failed to upload document to S3:", error);
      throw new Error("Failed to upload document to storage");
    }
  }

  /**
   * Download document content from S3
   */
  async downloadDocument(filePath: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error("Document not found in storage");
      }

      const content = await response.Body.transformToString();
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to download document from S3:", error);
      throw new Error("Failed to retrieve document from storage");
    }
  }

  /**
   * Delete document from S3
   */
  async deleteDocument(filePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      console.log(`Document deleted from S3: ${filePath}`);
    } catch (error) {
      console.error("Failed to delete document from S3:", error);
      throw new Error("Failed to delete document from storage");
    }
  }

  /**
   * Generate presigned URL for direct uploads (optional, for future use)
   */
  async generatePresignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        ContentType: "application/json",
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error("Failed to generate presigned URL:", error);
      throw new Error("Failed to generate upload URL");
    }
  }

  /**
   * Check if document exists in S3
   */
  async documentExists(filePath: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service();