import { s3Service } from './s3.ts';

export type StorageMode = 'postgres' | 's3' | 'hybrid';

export class StorageService {
  private mode: StorageMode;

  constructor() {
    // Check if S3 is configured
    const hasS3Config = process.env.AWS_ACCESS_KEY_ID && 
                       process.env.AWS_SECRET_ACCESS_KEY && 
                       process.env.S3_BUCKET_NAME;
    
    // Use hybrid mode if S3 is configured, otherwise PostgreSQL only
    this.mode = hasS3Config ? 'hybrid' : 'postgres';
    
    console.log(`Storage service initialized in ${this.mode} mode`);
  }

  /**
   * Generate file path for document storage
   */
  generateFilePath(documentId: string, version: number = 1): string {
    return `documents/${documentId}/v${version}.json`;
  }

  /**
   * Store document content
   * Returns: { content: any, filePath: string | null }
   */
  async storeDocument(documentId: string, content: any, version: number = 1): Promise<{
    content: any;
    filePath: string | null;
  }> {
    const filePath = this.generateFilePath(documentId, version);

    switch (this.mode) {
      case 'postgres':
        // Store only in PostgreSQL
        return {
          content,
          filePath: null, // No S3 storage
        };

      case 's3':
        // Store only in S3
        try {
          await s3Service.uploadDocument(documentId, content, version);
          return {
            content: null, // Don't store in PostgreSQL
            filePath,
          };
        } catch (error) {
          console.error('S3 storage failed, falling back to PostgreSQL:', error);
          return {
            content,
            filePath: null,
          };
        }

      case 'hybrid':
        // Store in both PostgreSQL AND S3
        try {
          await s3Service.uploadDocument(documentId, content, version);
          return {
            content, // Keep in PostgreSQL for now
            filePath, // Also store S3 path
          };
        } catch (error) {
          console.error('S3 storage failed, using PostgreSQL only:', error);
          return {
            content,
            filePath: null,
          };
        }

      default:
        throw new Error(`Unknown storage mode: ${this.mode}`);
    }
  }

  /**
   * Retrieve document content
   */
  async retrieveDocument(content: any, filePath: string | null): Promise<any> {
    // If we have content in PostgreSQL, use it (fastest)
    if (content !== null && content !== undefined) {
      return content;
    }

    // If we have a filePath, try to get from S3
    if (filePath && this.mode !== 'postgres') {
      try {
        return await s3Service.downloadDocument(filePath);
      } catch (error) {
        console.error('Failed to retrieve from S3:', error);
        throw new Error('Document content not found');
      }
    }

    throw new Error('Document content not available');
  }

  /**
   * Delete document from storage
   */
  async deleteDocument(filePath: string | null): Promise<void> {
    if (filePath && this.mode !== 'postgres') {
      try {
        await s3Service.deleteDocument(filePath);
        console.log(`Document deleted from S3: ${filePath}`);
      } catch (error) {
        console.error('Failed to delete from S3:', error);
        // Don't throw error - soft delete still works with PostgreSQL
      }
    }
  }

  /**
   * Get current storage mode
   */
  getStorageMode(): StorageMode {
    return this.mode;
  }

  /**
   * Check if S3 is available
   */
  isS3Available(): boolean {
    return this.mode === 's3' || this.mode === 'hybrid';
  }

  /**
   * Migrate document from PostgreSQL to S3 (for future use)
   */
  async migrateToS3(documentId: string, content: any, version: number = 1): Promise<string | null> {
    if (this.mode === 'postgres') {
      console.log('S3 not available, skipping migration');
      return null;
    }

    try {
      const filePath = await s3Service.uploadDocument(documentId, content, version);
      console.log(`Document migrated to S3: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Failed to migrate document to S3:', error);
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();