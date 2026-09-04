const {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Enterprise AWS S3 Storage Adapter
 * Strictly tenant-isolated object key partitioning: org_<organisationId>/documents/<documentId>/<fileName>
 */
class AwsS3Adapter {
  constructor(config = {}) {
    this.region = config.region || process.env.AWS_REGION || "us-east-1";
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  }

  isConfigured() {
    return Boolean(this.region && this.bucket && this.accessKeyId && this.secretAccessKey);
  }

  getClient() {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error("AWS S3 credentials (Access Key ID & Secret Access Key) are missing.");
    }
    return new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  /**
   * Test Connection: Check Bucket existence and accessibility
   */
  async testConnection() {
    const startTime = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          status: "NOT_CONFIGURED",
          error: "AWS S3 configuration missing. Ensure AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.",
        };
      }

      const client = this.getClient();
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await client.send(command);

      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        region: this.region,
        bucket: this.bucket,
        message: `AWS S3 Bucket "${this.bucket}" verified and accessible.`,
      };
    } catch (err) {
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: err.message || "Failed to access AWS S3 bucket.",
      };
    }
  }

  /**
   * Tenant-isolated object key generator
   */
  generateTenantKey(organisationId, documentId, fileName) {
    const cleanDocId = documentId || `doc_${Date.now()}`;
    const cleanFileName = (fileName || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    return `org_${organisationId}/documents/${cleanDocId}/${cleanFileName}`;
  }

  /**
   * Upload Document buffer to tenant-isolated S3 key
   */
  async uploadDocument(organisationId, { documentId, fileName, buffer, mimeType = "application/pdf" }) {
    if (!buffer) throw new Error("File buffer is required for AWS S3 upload.");

    const client = this.getClient();
    const key = this.generateTenantKey(organisationId, documentId, fileName);
    const bodyBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, "utf8");

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: bodyBuf,
      ContentType: mimeType,
      Metadata: {
        organisationId: String(organisationId),
        documentId: String(documentId || ""),
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    return {
      success: true,
      bucket: this.bucket,
      key,
      sizeBytes: bodyBuf.length,
      uploadedAt: new Date().toISOString(),
      s3Uri: `s3://${this.bucket}/${key}`,
      publicUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    };
  }

  /**
   * Generate Presigned Download URL (valid for specified duration)
   */
  async getPresignedDownloadUrl(organisationId, key, expiresInSeconds = 3600) {
    if (!key.startsWith(`org_${organisationId}/`)) {
      throw new Error("Tenant isolation violation: Access denied to foreign organization S3 object.");
    }

    const client = this.getClient();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return { url, expiresInSeconds };
  }

  /**
   * Delete Document from S3
   */
  async deleteDocument(organisationId, key) {
    if (!key.startsWith(`org_${organisationId}/`)) {
      throw new Error("Tenant isolation violation: Access denied to foreign organization S3 object.");
    }

    const client = this.getClient();
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await client.send(command);
    return { success: true, deletedKey: key };
  }
}

module.exports = AwsS3Adapter;
