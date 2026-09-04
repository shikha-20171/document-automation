const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

class S3StorageProvider {
  /**
   * Instantiate AWS S3Client
   */
  static createClient({ region, accessKeyId, secretAccessKey, endpoint = null }) {
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing required AWS S3 credentials (region, accessKeyId, secretAccessKey).");
    }

    const clientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    return new S3Client(clientConfig);
  }

  /**
   * Perform comprehensive, non-destructive connection and permissions validation
   */
  static async testConnection({ region, bucketName, accessKeyId, secretAccessKey, endpoint = null }) {
    const startTime = Date.now();
    let client;

    try {
      client = this.createClient({ region, accessKeyId, secretAccessKey, endpoint });
    } catch (err) {
      return {
        success: false,
        status: "INVALID_CREDENTIALS",
        error: "Unable to authenticate with AWS. Please verify Access Key ID and Secret Access Key.",
        technicalMessage: err.message,
      };
    }

    // 1. Verify bucket exists and is accessible
    try {
      const headBucketCmd = new HeadBucketCommand({ Bucket: bucketName });
      await client.send(headBucketCmd);
    } catch (err) {
      const statusCode = err.$metadata?.httpStatusCode;
      if (statusCode === 404) {
        return {
          success: false,
          status: "BUCKET_NOT_FOUND",
          error: `The specified S3 bucket '${bucketName}' does not exist in region '${region}'.`,
        };
      } else if (statusCode === 403 || statusCode === 401) {
        return {
          success: false,
          status: "ACCESS_DENIED",
          error: `AWS credentials do not have permission to access bucket '${bucketName}'. Please check S3 IAM permissions.`,
        };
      } else if (statusCode === 301) {
        return {
          success: false,
          status: "REGION_MISMATCH",
          error: `The configured region '${region}' does not match the actual bucket region.`,
        };
      }
      return {
        success: false,
        status: "CONNECTION_FAILED",
        error: `Could not access bucket '${bucketName}'. ${err.message || "Please check network and bucket policy."}`,
      };
    }

    // 2. Safe temporary write/read/delete test in isolated system prefix
    const testKey = `_docucore_system/connection-test/${uuidv4()}.tmp`;
    const testContent = `DocuCore Storage Connection Validation - ${new Date().toISOString()}`;

    try {
      // Put test object
      const putCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from(testContent, "utf8"),
        ContentType: "text/plain",
      });
      await client.send(putCmd);

      // Read test object back
      const getCmd = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await client.send(getCmd);

      // Clean up test object
      const delCmd = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await client.send(delCmd);

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        status: "CONNECTED",
        message: `AWS S3 Connected Successfully. Bucket '${bucketName}' in region '${region}' verified.`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } catch (err) {
      // Attempt cleanup even on failure
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
      } catch (cleanupErr) {
        // ignore
      }

      return {
        success: false,
        status: "PERMISSION_DENIED",
        error: `AWS credentials lack read/write/delete permissions on bucket '${bucketName}'. Required: s3:PutObject, s3:GetObject, s3:DeleteObject.`,
        technicalMessage: err.message,
      };
    }
  }

  /**
   * Upload binary buffer to AWS S3
   */
  static async putObject({ client, bucketName, key, buffer, mimeType = "application/octet-stream", sseType = "SSE-S3", kmsKeyId = null }) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };

    if (sseType === "SSE-KMS" && kmsKeyId) {
      params.ServerSideEncryption = "aws:kms";
      params.SSEKMSKeyId = kmsKeyId;
    } else if (sseType === "SSE-S3") {
      params.ServerSideEncryption = "AES256";
    }

    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    return {
      eTag: response.ETag,
      serverSideEncryption: response.ServerSideEncryption,
      versionId: response.VersionId,
    };
  }

  /**
   * Get object from AWS S3
   */
  static async getObject({ client, bucketName, key }) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    return response;
  }

  /**
   * Delete object from AWS S3
   */
  static async deleteObject({ client, bucketName, key }) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    return response;
  }

  /**
   * Generate short-lived presigned GET URL for secure viewing/downloading
   */
  static async getPresignedDownloadUrl({ client, bucketName, key, expiresInSeconds = 900, responseContentDisposition = null }) {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    if (responseContentDisposition) {
      params.ResponseContentDisposition = responseContentDisposition;
    }

    const command = new GetObjectCommand(params);
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Generate presigned PUT URL for direct frontend client uploads
   */
  static async getPresignedUploadUrl({ client, bucketName, key, mimeType = "application/octet-stream", expiresInSeconds = 900 }) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeType,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }
}

module.exports = S3StorageProvider;
