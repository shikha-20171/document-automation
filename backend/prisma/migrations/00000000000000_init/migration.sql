-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('DOCUMENT_CREATED', 'DOCUMENT_SUBMITTED', 'DOCUMENT_UPDATED', 'DOCUMENT_UPLOADED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "LogicType" AS ENUM ('SEQUENTIAL', 'PARALLEL');

-- CreateEnum
CREATE TYPE "LogicRequirement" AS ENUM ('ALL_REQUIRED', 'ANY_ONE');

-- CreateEnum
CREATE TYPE "AIProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AIConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'FAILED', 'TESTING');

-- CreateEnum
CREATE TYPE "AIModelStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "OrgModelAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OCRProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OCRConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'FAILED', 'TESTING');

-- CreateEnum
CREATE TYPE "OCRJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OCREngineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OCRRequestStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIJobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIRequestStatus" AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AIServiceStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'DOWN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD_STORAGE', 'LOCAL_STORAGE');

-- CreateEnum
CREATE TYPE "StorageClass" AS ENUM ('STANDARD', 'STANDARD_IA', 'GLACIER', 'DEEP_ARCHIVE');

-- CreateEnum
CREATE TYPE "StorageConfigStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "StorageHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'EXCEEDED');

-- CreateEnum
CREATE TYPE "RetentionAction" AS ENUM ('DELETE', 'ARCHIVE', 'MOVE_TO_COLD_STORAGE', 'KEEP_FOREVER');

-- CreateEnum
CREATE TYPE "RetentionPolicyStatus" AS ENUM ('ACTIVE', 'DISABLED', 'LOCKED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'SNAPSHOT');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RESTORED');

-- CreateEnum
CREATE TYPE "BackupTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "StorageAlertType" AS ENUM ('NEAR_QUOTA', 'QUOTA_EXCEEDED', 'BACKUP_FAILED', 'STORAGE_FAILURE', 'ENCRYPTION_ERROR', 'RETENTION_POLICY_FAILED');

-- CreateEnum
CREATE TYPE "StorageAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StorageAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "StorageHistoryPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('STANDARD', 'PRIORITY', 'DEDICATED', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionRequestType" AS ENUM ('UPGRADE', 'DOWNGRADE', 'RENEWAL', 'CANCELLATION', 'CUSTOM_QUOTE', 'ADD_ON_CREDITS');

-- CreateEnum
CREATE TYPE "SubscriptionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionHistoryAction" AS ENUM ('CREATED', 'UPGRADED', 'DOWNGRADED', 'RENEWED', 'SUSPENDED', 'REACTIVATED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('ORGANISATION', 'USER', 'BILLING', 'STORAGE', 'AI_CONFIG', 'SECURITY', 'PLATFORM');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'SYSTEM', 'SYSTEM_WORKER', 'SECURITY_GUARD');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TemplateFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATETIME', 'BOOLEAN', 'PHONE', 'EMAIL', 'CURRENCY', 'SELECT', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_WORKSPACE', 'GOOGLE_DRIVE', 'GOOGLE_DOCS', 'MICROSOFT_365', 'MICROSOFT_ONEDRIVE', 'MICROSOFT_TEAMS', 'AWS_S3', 'SLACK', 'SMTP_EMAIL', 'WHATSAPP_BUSINESS', 'SALESFORCE', 'HUBSPOT', 'ZOHO_CRM', 'DOCUSIGN', 'MICROSOFT_ENTRA_ID', 'CUSTOM_REST', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('STORAGE', 'COMMUNICATION', 'CRM', 'PRODUCTIVITY', 'E_SIGNATURE', 'AUTHENTICATION', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'FAILED', 'CONFIG_REQUIRED', 'NOT_CONFIGURED');

-- CreateTable
CREATE TABLE "organisations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT DEFAULT 'Headquarters',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_locations" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "name" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER,
    "location_id" INTEGER,
    "role_id" INTEGER,
    "department_id" INTEGER,
    "team_id" INTEGER,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ORGANISATION_ADMIN',
    "status" TEXT NOT NULL DEFAULT 'active',
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "custom_permissions" JSONB,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_password_change" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_invitations" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "head" TEXT,
    "owner_user_id" INTEGER,
    "employees_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "team_lead" TEXT,
    "members" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "team_id" INTEGER,
    "created_by_user_id" INTEGER,
    "name" TEXT NOT NULL,
    "original_name" TEXT,
    "type" TEXT,
    "mime_type" TEXT,
    "size" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "file_size_bytes" BIGINT DEFAULT 0,
    "storage_provider" TEXT DEFAULT 'aws_s3',
    "s3_bucket" TEXT,
    "s3_key" TEXT,
    "folder" TEXT,
    "folder_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "team_id" INTEGER,
    "created_by_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" TEXT,
    "assigned_to_id" TEXT,
    "assigned_email" TEXT,
    "related_doc_id" TEXT,
    "related_doc_name" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "start_date" TEXT,
    "due_date" TEXT,
    "instructions" TEXT,
    "team" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "authorName" TEXT NOT NULL DEFAULT 'User',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_policies" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "mfaEnforced" BOOLEAN NOT NULL DEFAULT false,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireComplexity" BOOLEAN NOT NULL DEFAULT true,
    "lockoutDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "sensitiveDocAiRestricted" BOOLEAN NOT NULL DEFAULT false,
    "externalAiRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_policies" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "monthlyQuotaRequests" INTEGER NOT NULL DEFAULT 10000,
    "allowedProviders" TEXT[] DEFAULT ARRAY['GEMINI', 'OPENAI', 'CLAUDE']::TEXT[],
    "allowedTools" TEXT[] DEFAULT ARRAY['DOCUMENT_GENERATION', 'OCR', 'QA', 'SUMMARIZATION']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "category" TEXT,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "related_document" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_ai_tool_runs" (
    "id" TEXT NOT NULL,
    "organisation_id" INTEGER,
    "user_id" INTEGER,
    "department_name" TEXT,
    "tool" TEXT NOT NULL,
    "title" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_ai_tool_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_ai_templates" (
    "id" TEXT NOT NULL,
    "organisation_id" INTEGER,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "template_body" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_ai_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_ai_extracted_records" (
    "id" TEXT NOT NULL,
    "run_id" TEXT,
    "organisation_id" INTEGER,
    "user_id" INTEGER,
    "document_name" TEXT,
    "record_type" TEXT,
    "data" JSONB NOT NULL,
    "saved_to" TEXT DEFAULT 'DOCUMENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_ai_extracted_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "appliesTo" TEXT NOT NULL,
    "department" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL DEFAULT 'DOCUMENT_SUBMITTED',
    "logicType" "LogicType" NOT NULL DEFAULT 'SEQUENTIAL',
    "logicRequirement" "LogicRequirement" NOT NULL DEFAULT 'ALL_REQUIRED',
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalDeadlineDays" INTEGER NOT NULL DEFAULT 3,
    "reminderAfterHours" INTEGER NOT NULL DEFAULT 24,
    "escalationAfterHours" INTEGER NOT NULL DEFAULT 48,
    "commentsRequiredOnRejection" BOOLEAN NOT NULL DEFAULT false,
    "allowRequestChanges" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "approverType" VARCHAR(50) NOT NULL,
    "approvalType" "ApprovalType" NOT NULL DEFAULT 'INTERNAL',
    "externalApproverName" TEXT,
    "externalApproverEmail" TEXT,
    "externalApproverCompany" TEXT,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "workflowId" TEXT NOT NULL,
    "documentId" INTEGER,
    "documentName" TEXT NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "currentStepOrder" INTEGER DEFAULT 0,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_actions" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "stepOrder" INTEGER,
    "performedById" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_history" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "workflowStepId" TEXT,
    "userId" INTEGER,
    "userRole" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "workflowId" TEXT,
    "name" TEXT NOT NULL,
    "conditionJson" TEXT NOT NULL,
    "approversJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" TEXT NOT NULL,
    "providerName" VARCHAR(100) NOT NULL,
    "providerCode" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "baseUrl" TEXT,
    "apiVersion" VARCHAR(50),
    "apiKeyEncrypted" TEXT,
    "region" VARCHAR(100),
    "status" "AIProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectionStatus" "AIConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "supportsChat" BOOLEAN NOT NULL DEFAULT true,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "supportsOCR" BOOLEAN NOT NULL DEFAULT false,
    "supportsStreaming" BOOLEAN NOT NULL DEFAULT true,
    "requestTimeoutMs" INTEGER NOT NULL DEFAULT 60000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "healthScore" DOUBLE PRECISION,
    "lastConnectedAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "modelCode" VARCHAR(100) NOT NULL,
    "modelVersion" VARCHAR(50),
    "description" TEXT,
    "contextWindow" INTEGER,
    "maxInputTokens" INTEGER,
    "maxOutputTokens" INTEGER,
    "inputCostPer1K" DECIMAL(10,4),
    "outputCostPer1K" DECIMAL(10,4),
    "supportsStreaming" BOOLEAN NOT NULL DEFAULT true,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "supportsFunctionCalling" BOOLEAN NOT NULL DEFAULT false,
    "supportsJSONMode" BOOLEAN NOT NULL DEFAULT false,
    "supportsImageInput" BOOLEAN NOT NULL DEFAULT false,
    "status" "AIModelStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "totalRequests" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_ai_model_assignments" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" "OrgModelAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_ai_model_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_capabilities" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "defaultModel" VARCHAR(100) NOT NULL DEFAULT 'gemini-3.5-flash',
    "fallbackModel" VARCHAR(100) DEFAULT 'gpt-4o-mini',
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "systemPrompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_providers" (
    "id" TEXT NOT NULL,
    "providerName" VARCHAR(100) NOT NULL,
    "providerCode" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "apiEndpoint" TEXT,
    "credentialsEncrypted" TEXT,
    "authType" VARCHAR(50) NOT NULL DEFAULT 'API_KEY',
    "region" VARCHAR(100) DEFAULT 'global',
    "status" "OCRProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectionStatus" "OCRConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "supportedFormats" TEXT[] DEFAULT ARRAY['PDF', 'PNG', 'JPG', 'TIFF', 'WEBP']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_profiles" (
    "id" TEXT NOT NULL,
    "profileName" VARCHAR(100) NOT NULL,
    "profileCode" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "providerId" TEXT,
    "language" VARCHAR(50) NOT NULL DEFAULT 'eng',
    "inputFormats" TEXT[] DEFAULT ARRAY['PDF', 'PNG', 'JPG', 'TIFF']::TEXT[],
    "textDetection" BOOLEAN NOT NULL DEFAULT true,
    "tableDetection" BOOLEAN NOT NULL DEFAULT true,
    "layoutDetection" BOOLEAN NOT NULL DEFAULT true,
    "handwritingDetection" BOOLEAN NOT NULL DEFAULT false,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "outputFormat" VARCHAR(50) NOT NULL DEFAULT 'STRUCTURED_JSON',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" TEXT NOT NULL,
    "jobCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "documentId" TEXT,
    "documentName" VARCHAR(255),
    "providerId" TEXT,
    "profileId" TEXT,
    "language" TEXT DEFAULT 'eng',
    "pages" INTEGER NOT NULL DEFAULT 1,
    "status" "OCRJobStatus" NOT NULL DEFAULT 'QUEUED',
    "confidenceScore" DOUBLE PRECISION,
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_cost_usage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "providerId" TEXT,
    "profileId" TEXT,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "billingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "documentsProcessed" INTEGER NOT NULL DEFAULT 0,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_cost_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_logs" (
    "id" TEXT NOT NULL,
    "logCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "documentId" TEXT,
    "documentName" TEXT,
    "providerId" TEXT,
    "profileId" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "processingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_service_health" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "uptimePercent" DECIMAL(5,2) DEFAULT 99.9,
    "averageLatencyMs" INTEGER DEFAULT 320,
    "errorRate" DECIMAL(5,2) DEFAULT 0.1,
    "requestsToday" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2) DEFAULT 99.9,
    "rateLimitStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "queueStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "status" "AIServiceStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_service_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_engines" (
    "id" TEXT NOT NULL,
    "engineName" VARCHAR(100) NOT NULL,
    "engineCode" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "supportedLanguages" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "averageResponseMs" INTEGER,
    "status" "OCREngineStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "supportsHandwriting" BOOLEAN NOT NULL DEFAULT false,
    "supportsTables" BOOLEAN NOT NULL DEFAULT false,
    "supportsForms" BOOLEAN NOT NULL DEFAULT false,
    "supportsMultiPage" BOOLEAN NOT NULL DEFAULT true,
    "version" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_engines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_requests" (
    "id" TEXT NOT NULL,
    "requestCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT,
    "engineId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSizeMB" DECIMAL(10,2),
    "language" TEXT,
    "confidence" DOUBLE PRECISION,
    "extractedPages" INTEGER,
    "processingTimeMs" INTEGER,
    "status" "OCRRequestStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs_queue" (
    "id" TEXT NOT NULL,
    "jobCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "documentId" TEXT,
    "requestType" VARCHAR(100) NOT NULL,
    "priority" "AIJobPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "queueName" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_jobs_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" TEXT NOT NULL,
    "logCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "jobId" TEXT,
    "promptType" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(10,4) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "requestStatus" "AIRequestStatus" NOT NULL,
    "ipAddress" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_cost_usage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "billingDate" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" BIGINT NOT NULL DEFAULT 0,
    "outputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "averageCost" DECIMAL(10,4),
    "budgetLimit" DECIMAL(12,2),
    "budgetExceeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_cost_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_service_health" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "uptimePercent" DECIMAL(5,2),
    "averageLatencyMs" INTEGER,
    "errorRate" DECIMAL(5,2),
    "requestsToday" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2),
    "lastIncident" TEXT,
    "status" "AIServiceStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_service_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_configs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "providerType" "StorageProviderType" NOT NULL DEFAULT 'AWS_S3',
    "bucketName" VARCHAR(150) NOT NULL,
    "bucketRegion" VARCHAR(80) NOT NULL DEFAULT 'ap-south-1',
    "basePrefix" VARCHAR(150),
    "accessKeyIdEncrypted" TEXT,
    "secretAccessKeyEncrypted" TEXT,
    "kmsKeyIdEncrypted" TEXT,
    "encryptionType" VARCHAR(50) DEFAULT 'SSE-S3',
    "connectionStatus" VARCHAR(50) NOT NULL DEFAULT 'NOT_CONFIGURED',
    "lastTestedAt" TIMESTAMP(3),
    "lastConnectionError" TEXT,
    "storageClass" "StorageClass" NOT NULL DEFAULT 'STANDARD',
    "allocatedQuotaGB" INTEGER NOT NULL DEFAULT 500,
    "maxUploadFileSizeMB" INTEGER NOT NULL DEFAULT 50,
    "warningThresholdPercent" INTEGER NOT NULL DEFAULT 85,
    "autoCleanupAfterDays" INTEGER NOT NULL DEFAULT 30,
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "compressionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "versioningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isGlobalDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "StorageConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_storage_usage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "totalAllocatedGB" DECIMAL(12,2) NOT NULL,
    "usedStorageGB" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalFolders" INTEGER NOT NULL DEFAULT 0,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "totalArchives" INTEGER NOT NULL DEFAULT 0,
    "healthStatus" "StorageHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "lastUploadedAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_storage_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_retention_policies" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "policyName" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "documentCategory" VARCHAR(100) NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "actionOnExpiry" "RetentionAction" NOT NULL DEFAULT 'DELETE',
    "status" "RetentionPolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "isGlobalDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_backups" (
    "id" TEXT NOT NULL,
    "backupCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT,
    "backupName" VARCHAR(150) NOT NULL,
    "backupType" "BackupType" NOT NULL,
    "triggerType" "BackupTrigger" NOT NULL,
    "storageProvider" "StorageProviderType" NOT NULL DEFAULT 'AWS_S3',
    "storagePath" TEXT NOT NULL,
    "bucketName" TEXT,
    "backupSizeGB" DECIMAL(10,2) NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "compressed" BOOLEAN NOT NULL DEFAULT true,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_alerts" (
    "id" TEXT NOT NULL,
    "alertCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "alertType" "StorageAlertType" NOT NULL,
    "severity" "StorageAlertSeverity" NOT NULL,
    "status" "StorageAlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "currentUsageGB" DECIMAL(12,2),
    "quotaLimitGB" DECIMAL(12,2),
    "usagePercent" DECIMAL(5,2),
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_usage_history" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "period" "StorageHistoryPeriod" NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "allocatedStorageGB" DECIMAL(12,2) NOT NULL,
    "usedStorageGB" DECIMAL(12,2) NOT NULL,
    "uploadedStorageGB" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deletedStorageGB" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalUploads" INTEGER NOT NULL DEFAULT 0,
    "totalDeletes" INTEGER NOT NULL DEFAULT 0,
    "averageFileSizeMB" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "planName" VARCHAR(100) NOT NULL,
    "planCode" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "yearlyPrice" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "userLimit" INTEGER,
    "storageLimitGB" INTEGER,
    "aiCredits" INTEGER,
    "ocrLimit" INTEGER DEFAULT 1000,
    "apiRateLimit" INTEGER,
    "supportLevel" "SupportLevel" NOT NULL DEFAULT 'STANDARD',
    "badge" VARCHAR(50),
    "whiteLabelEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customBranding" BOOLEAN NOT NULL DEFAULT false,
    "dedicatedApi" BOOLEAN NOT NULL DEFAULT false,
    "customSLA" BOOLEAN NOT NULL DEFAULT false,
    "isMostPopular" BOOLEAN NOT NULL DEFAULT false,
    "isCustomPlan" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_features" (
    "id" TEXT NOT NULL,
    "featureKey" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_features" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitValue" DECIMAL(12,2),
    "limitUnit" VARCHAR(50),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_subscriptions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "nextBillingDate" TIMESTAMP(3),
    "lastBillingDate" TIMESTAMP(3),
    "renewedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "cancellationReason" TEXT,
    "customUserLimit" INTEGER,
    "customStorageLimitGB" INTEGER,
    "customAICredits" INTEGER,
    "customOCRLimit" INTEGER,
    "monthlyPrice" DECIMAL(12,2),
    "discountAmount" DECIMAL(12,2),
    "finalPrice" DECIMAL(12,2),
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" VARCHAR(50) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "currentPlanId" TEXT NOT NULL,
    "requestedPlanId" TEXT,
    "requestType" "SubscriptionRequestType" NOT NULL,
    "status" "SubscriptionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestReason" TEXT,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "action" "SubscriptionHistoryAction" NOT NULL,
    "oldPlanId" TEXT,
    "newPlanId" TEXT,
    "oldStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus",
    "amountPaid" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "transactionReference" VARCHAR(150),
    "performedBy" TEXT,
    "remarks" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "eventId" VARCHAR(50) NOT NULL,
    "actorId" TEXT,
    "actorUserId" TEXT,
    "actorName" VARCHAR(150) NOT NULL,
    "actorRole" VARCHAR(50),
    "actorType" "AuditActorType" DEFAULT 'SUPER_ADMIN',
    "organisationId" TEXT,
    "organisationName" VARCHAR(150),
    "module" "AuditModule" DEFAULT 'PLATFORM',
    "action" VARCHAR(150) NOT NULL,
    "resourceType" VARCHAR(100),
    "resourceId" VARCHAR(150),
    "resourceName" VARCHAR(255),
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    "result" "AuditResult" DEFAULT 'SUCCESS',
    "ipAddress" VARCHAR(100),
    "userAgent" TEXT,
    "browser" VARCHAR(100),
    "operatingSystem" VARCHAR(100),
    "location" VARCHAR(150),
    "requestId" VARCHAR(100),
    "metadata" JSONB,
    "beforeData" JSONB,
    "afterData" JSONB,
    "details" JSONB,
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticketCode" VARCHAR(50) NOT NULL,
    "organisationId" TEXT,
    "organisationName" VARCHAR(255) NOT NULL,
    "adminName" VARCHAR(150) NOT NULL,
    "adminEmail" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_replies" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderName" VARCHAR(150) NOT NULL,
    "senderRole" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "systemName" VARCHAR(100) NOT NULL DEFAULT 'DocuCore AI',
    "supportEmail" VARCHAR(150) NOT NULL DEFAULT 'support@docucore.ai',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maxFileUploadMb" INTEGER NOT NULL DEFAULT 50,
    "defaultStorageQuotaGb" INTEGER NOT NULL DEFAULT 500,
    "enforceTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "customConfig" JSONB,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'HR',
    "documentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "DocumentTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TemplateFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_integrations" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "accountName" TEXT,
    "accountEmail" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "connectedById" INTEGER,
    "connectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "organisation_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "integrationId" TEXT,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_rest_integrations" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL DEFAULT 'NONE',
    "authConfig" JSONB,
    "headers" JSONB,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "retryCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_rest_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_api_keys" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" VARCHAR(50) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "organisation_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_webhooks" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "events" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_integrations" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "clientIdEncrypted" TEXT,
    "clientSecretEncrypted" TEXT,
    "redirectUri" TEXT,
    "tenantId" TEXT,
    "allowedScopes" TEXT[],
    "settings" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_clients" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Company',
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "department" TEXT,
    "assignedTo" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "designation" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_documents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Contract',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "owner" TEXT,
    "fileKey" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'New Document',
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'New',
    "assignedTo" TEXT,
    "dueDate" TEXT,
    "requestedBy" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'Admin',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_generation_jobs" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "downloadUrl" TEXT,
    "zipKey" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_generation_records" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "recordIndex" INTEGER NOT NULL,
    "documentId" INTEGER,
    "documentName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_generation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_extractions" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "documentId" INTEGER,
    "documentName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'INVOICE',
    "structuredData" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 95.0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_envelopes" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signingOrder" TEXT NOT NULL DEFAULT 'SEQUENTIAL',
    "certificateHash" TEXT,
    "createdById" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_recipients" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SIGNER',
    "order" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_executions" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "stepsExecuted" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "resultSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_forms" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "submitAction" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_form_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "submittedData" JSONB NOT NULL,
    "generatedDocumentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_sync_logs" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "entityType" TEXT NOT NULL DEFAULT 'CONTACT',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "authorName" TEXT NOT NULL DEFAULT 'User',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "transactionRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "planCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_usage_snapshots" (
    "id" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "aiRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "ocrPagesUsed" INTEGER NOT NULL DEFAULT 0,
    "storageBytesUsed" BIGINT NOT NULL DEFAULT 0,
    "documentsCount" INTEGER NOT NULL DEFAULT 0,
    "workflowsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_usage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isEnabledGlobal" BOOLEAN NOT NULL DEFAULT false,
    "organisationOverrides" JSONB,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BANNER',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "affectedServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_access_logs" (
    "id" TEXT NOT NULL,
    "superAdminId" INTEGER NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "authorizedUntil" TIMESTAMP(3) NOT NULL,
    "actionsPerformed" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_change_requests" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "requesterName" TEXT,
    "changeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentValue" JSONB,
    "requestedValue" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approverId" INTEGER,
    "approverName" TEXT,
    "approvalReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governance_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_review_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organisationId" INTEGER NOT NULL,
    "reviewerId" INTEGER,
    "reviewerName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_review_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_review_items" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "currentDepartmentId" INTEGER,
    "currentDepartment" TEXT,
    "lastLogin" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionReason" TEXT,
    "decidedById" INTEGER,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_incidents" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SECURITY',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reporterId" INTEGER,
    "reporterName" TEXT,
    "assigneeId" INTEGER,
    "assigneeName" TEXT,
    "resolution" TEXT,
    "investigationNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governance_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_incident_history" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "actorId" INTEGER,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_incident_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_risks" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SECURITY',
    "likelihood" TEXT NOT NULL DEFAULT 'LOW',
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "riskScore" INTEGER NOT NULL DEFAULT 6,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "ownerId" INTEGER,
    "ownerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "mitigationPlan" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governance_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_risk_history" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "actorId" INTEGER,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_risk_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organisations_name_idx" ON "organisations"("name");

-- CreateIndex
CREATE INDEX "organisations_branch_idx" ON "organisations"("branch");

-- CreateIndex
CREATE INDEX "organisations_status_idx" ON "organisations"("status");

-- CreateIndex
CREATE INDEX "organisation_locations_organisation_id_idx" ON "organisation_locations"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_locations_city_idx" ON "organisation_locations"("city");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_locations_organisation_id_city_key" ON "organisation_locations"("organisation_id", "city");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organisation_id_idx" ON "users"("organisation_id");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_team_id_idx" ON "users"("team_id");

-- CreateIndex
CREATE INDEX "users_location_id_idx" ON "users"("location_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_invitations_token_hash_key" ON "organisation_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "organisation_invitations_organisation_id_idx" ON "organisation_invitations"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_invitations_email_idx" ON "organisation_invitations"("email");

-- CreateIndex
CREATE INDEX "organisation_invitations_token_hash_idx" ON "organisation_invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "departments_organisation_id_idx" ON "departments"("organisation_id");

-- CreateIndex
CREATE INDEX "departments_owner_user_id_idx" ON "departments"("owner_user_id");

-- CreateIndex
CREATE INDEX "documents_organisation_id_idx" ON "documents"("organisation_id");

-- CreateIndex
CREATE INDEX "documents_department_id_idx" ON "documents"("department_id");

-- CreateIndex
CREATE INDEX "documents_team_id_idx" ON "documents"("team_id");

-- CreateIndex
CREATE INDEX "documents_s3_key_idx" ON "documents"("s3_key");

-- CreateIndex
CREATE INDEX "tasks_organisation_id_idx" ON "tasks"("organisation_id");

-- CreateIndex
CREATE INDEX "tasks_department_id_idx" ON "tasks"("department_id");

-- CreateIndex
CREATE INDEX "tasks_team_id_idx" ON "tasks"("team_id");

-- CreateIndex
CREATE INDEX "task_comments_taskId_idx" ON "task_comments"("taskId");

-- CreateIndex
CREATE INDEX "task_comments_organisationId_idx" ON "task_comments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "security_policies_organisationId_key" ON "security_policies"("organisationId");

-- CreateIndex
CREATE INDEX "security_policies_organisationId_idx" ON "security_policies"("organisationId");

-- CreateIndex
CREATE INDEX "ai_usage_policies_organisationId_idx" ON "ai_usage_policies"("organisationId");

-- CreateIndex
CREATE INDEX "ai_usage_policies_organisationId_departmentId_idx" ON "ai_usage_policies"("organisationId", "departmentId");

-- CreateIndex
CREATE INDEX "notifications_organisation_id_idx" ON "notifications"("organisation_id");

-- CreateIndex
CREATE INDEX "department_ai_tool_runs_organisation_id_idx" ON "department_ai_tool_runs"("organisation_id");

-- CreateIndex
CREATE INDEX "department_ai_tool_runs_user_id_idx" ON "department_ai_tool_runs"("user_id");

-- CreateIndex
CREATE INDEX "department_ai_tool_runs_tool_idx" ON "department_ai_tool_runs"("tool");

-- CreateIndex
CREATE INDEX "department_ai_tool_runs_created_at_idx" ON "department_ai_tool_runs"("created_at");

-- CreateIndex
CREATE INDEX "department_ai_templates_organisation_id_idx" ON "department_ai_templates"("organisation_id");

-- CreateIndex
CREATE INDEX "department_ai_templates_user_id_idx" ON "department_ai_templates"("user_id");

-- CreateIndex
CREATE INDEX "department_ai_templates_updated_at_idx" ON "department_ai_templates"("updated_at");

-- CreateIndex
CREATE INDEX "department_ai_extracted_records_run_id_idx" ON "department_ai_extracted_records"("run_id");

-- CreateIndex
CREATE INDEX "department_ai_extracted_records_organisation_id_idx" ON "department_ai_extracted_records"("organisation_id");

-- CreateIndex
CREATE INDEX "department_ai_extracted_records_user_id_idx" ON "department_ai_extracted_records"("user_id");

-- CreateIndex
CREATE INDEX "workflows_organisationId_idx" ON "workflows"("organisationId");

-- CreateIndex
CREATE INDEX "workflows_organisationId_status_idx" ON "workflows"("organisationId", "status");

-- CreateIndex
CREATE INDEX "workflow_steps_workflowId_idx" ON "workflow_steps"("workflowId");

-- CreateIndex
CREATE INDEX "approval_requests_organisationId_idx" ON "approval_requests"("organisationId");

-- CreateIndex
CREATE INDEX "approval_requests_workflowId_idx" ON "approval_requests"("workflowId");

-- CreateIndex
CREATE INDEX "approval_requests_documentId_idx" ON "approval_requests"("documentId");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_actions_approvalRequestId_idx" ON "approval_actions"("approvalRequestId");

-- CreateIndex
CREATE INDEX "approval_history_approvalRequestId_idx" ON "approval_history"("approvalRequestId");

-- CreateIndex
CREATE INDEX "approval_rules_organisationId_idx" ON "approval_rules"("organisationId");

-- CreateIndex
CREATE INDEX "approval_rules_organisationId_status_idx" ON "approval_rules"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_providerCode_key" ON "ai_providers"("providerCode");

-- CreateIndex
CREATE INDEX "ai_providers_providerCode_idx" ON "ai_providers"("providerCode");

-- CreateIndex
CREATE INDEX "ai_providers_status_idx" ON "ai_providers"("status");

-- CreateIndex
CREATE INDEX "ai_providers_connectionStatus_idx" ON "ai_providers"("connectionStatus");

-- CreateIndex
CREATE INDEX "ai_models_providerId_idx" ON "ai_models"("providerId");

-- CreateIndex
CREATE INDEX "ai_models_status_idx" ON "ai_models"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_providerId_modelCode_key" ON "ai_models"("providerId", "modelCode");

-- CreateIndex
CREATE INDEX "organization_ai_model_assignments_organisationId_idx" ON "organization_ai_model_assignments"("organisationId");

-- CreateIndex
CREATE INDEX "organization_ai_model_assignments_modelId_idx" ON "organization_ai_model_assignments"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_ai_model_assignments_organisationId_modelId_key" ON "organization_ai_model_assignments"("organisationId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_capabilities_code_key" ON "ai_capabilities"("code");

-- CreateIndex
CREATE INDEX "ai_capabilities_code_idx" ON "ai_capabilities"("code");

-- CreateIndex
CREATE INDEX "ai_capabilities_status_idx" ON "ai_capabilities"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_providers_providerCode_key" ON "ocr_providers"("providerCode");

-- CreateIndex
CREATE INDEX "ocr_providers_providerCode_idx" ON "ocr_providers"("providerCode");

-- CreateIndex
CREATE INDEX "ocr_providers_status_idx" ON "ocr_providers"("status");

-- CreateIndex
CREATE INDEX "ocr_providers_connectionStatus_idx" ON "ocr_providers"("connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_profiles_profileCode_key" ON "ocr_profiles"("profileCode");

-- CreateIndex
CREATE INDEX "ocr_profiles_profileCode_idx" ON "ocr_profiles"("profileCode");

-- CreateIndex
CREATE INDEX "ocr_profiles_status_idx" ON "ocr_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_jobs_jobCode_key" ON "ocr_jobs"("jobCode");

-- CreateIndex
CREATE INDEX "ocr_jobs_organisationId_idx" ON "ocr_jobs"("organisationId");

-- CreateIndex
CREATE INDEX "ocr_jobs_status_idx" ON "ocr_jobs"("status");

-- CreateIndex
CREATE INDEX "ocr_jobs_providerId_idx" ON "ocr_jobs"("providerId");

-- CreateIndex
CREATE INDEX "ocr_jobs_createdAt_idx" ON "ocr_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "ocr_cost_usage_organisationId_idx" ON "ocr_cost_usage"("organisationId");

-- CreateIndex
CREATE INDEX "ocr_cost_usage_billingDate_idx" ON "ocr_cost_usage"("billingDate");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_logs_logCode_key" ON "ocr_logs"("logCode");

-- CreateIndex
CREATE INDEX "ocr_logs_organisationId_idx" ON "ocr_logs"("organisationId");

-- CreateIndex
CREATE INDEX "ocr_logs_providerId_idx" ON "ocr_logs"("providerId");

-- CreateIndex
CREATE INDEX "ocr_logs_status_idx" ON "ocr_logs"("status");

-- CreateIndex
CREATE INDEX "ocr_logs_createdAt_idx" ON "ocr_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_service_health_providerId_key" ON "ocr_service_health"("providerId");

-- CreateIndex
CREATE INDEX "ocr_service_health_status_idx" ON "ocr_service_health"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_engines_engineCode_key" ON "ocr_engines"("engineCode");

-- CreateIndex
CREATE INDEX "ocr_engines_status_idx" ON "ocr_engines"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_requests_requestCode_key" ON "ocr_requests"("requestCode");

-- CreateIndex
CREATE INDEX "ocr_requests_organisationId_idx" ON "ocr_requests"("organisationId");

-- CreateIndex
CREATE INDEX "ocr_requests_status_idx" ON "ocr_requests"("status");

-- CreateIndex
CREATE INDEX "ocr_requests_engineId_idx" ON "ocr_requests"("engineId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_jobs_queue_jobCode_key" ON "ai_jobs_queue"("jobCode");

-- CreateIndex
CREATE INDEX "ai_jobs_queue_organisationId_idx" ON "ai_jobs_queue"("organisationId");

-- CreateIndex
CREATE INDEX "ai_jobs_queue_status_idx" ON "ai_jobs_queue"("status");

-- CreateIndex
CREATE INDEX "ai_jobs_queue_providerId_idx" ON "ai_jobs_queue"("providerId");

-- CreateIndex
CREATE INDEX "ai_jobs_queue_modelId_idx" ON "ai_jobs_queue"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_logs_logCode_key" ON "ai_logs"("logCode");

-- CreateIndex
CREATE INDEX "ai_logs_organisationId_idx" ON "ai_logs"("organisationId");

-- CreateIndex
CREATE INDEX "ai_logs_providerId_idx" ON "ai_logs"("providerId");

-- CreateIndex
CREATE INDEX "ai_logs_modelId_idx" ON "ai_logs"("modelId");

-- CreateIndex
CREATE INDEX "ai_logs_requestStatus_idx" ON "ai_logs"("requestStatus");

-- CreateIndex
CREATE INDEX "ai_logs_createdAt_idx" ON "ai_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_cost_usage_organisationId_idx" ON "ai_cost_usage"("organisationId");

-- CreateIndex
CREATE INDEX "ai_cost_usage_billingDate_idx" ON "ai_cost_usage"("billingDate");

-- CreateIndex
CREATE INDEX "ai_cost_usage_billingPeriod_idx" ON "ai_cost_usage"("billingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "ai_service_health_providerId_key" ON "ai_service_health"("providerId");

-- CreateIndex
CREATE INDEX "ai_service_health_status_idx" ON "ai_service_health"("status");

-- CreateIndex
CREATE UNIQUE INDEX "storage_configs_organisationId_key" ON "storage_configs"("organisationId");

-- CreateIndex
CREATE INDEX "storage_configs_organisationId_idx" ON "storage_configs"("organisationId");

-- CreateIndex
CREATE INDEX "storage_configs_providerType_idx" ON "storage_configs"("providerType");

-- CreateIndex
CREATE INDEX "storage_configs_status_idx" ON "storage_configs"("status");

-- CreateIndex
CREATE INDEX "storage_configs_connectionStatus_idx" ON "storage_configs"("connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_storage_usage_organisationId_key" ON "organisation_storage_usage"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_storage_usage_organisationId_idx" ON "organisation_storage_usage"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_storage_usage_healthStatus_idx" ON "organisation_storage_usage"("healthStatus");

-- CreateIndex
CREATE INDEX "storage_retention_policies_organisationId_idx" ON "storage_retention_policies"("organisationId");

-- CreateIndex
CREATE INDEX "storage_retention_policies_documentCategory_idx" ON "storage_retention_policies"("documentCategory");

-- CreateIndex
CREATE INDEX "storage_retention_policies_status_idx" ON "storage_retention_policies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "storage_backups_backupCode_key" ON "storage_backups"("backupCode");

-- CreateIndex
CREATE INDEX "storage_backups_organisationId_idx" ON "storage_backups"("organisationId");

-- CreateIndex
CREATE INDEX "storage_backups_status_idx" ON "storage_backups"("status");

-- CreateIndex
CREATE INDEX "storage_backups_backupType_idx" ON "storage_backups"("backupType");

-- CreateIndex
CREATE INDEX "storage_backups_triggerType_idx" ON "storage_backups"("triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "storage_alerts_alertCode_key" ON "storage_alerts"("alertCode");

-- CreateIndex
CREATE INDEX "storage_alerts_organisationId_idx" ON "storage_alerts"("organisationId");

-- CreateIndex
CREATE INDEX "storage_alerts_alertType_idx" ON "storage_alerts"("alertType");

-- CreateIndex
CREATE INDEX "storage_alerts_severity_idx" ON "storage_alerts"("severity");

-- CreateIndex
CREATE INDEX "storage_alerts_status_idx" ON "storage_alerts"("status");

-- CreateIndex
CREATE INDEX "storage_usage_history_organisationId_idx" ON "storage_usage_history"("organisationId");

-- CreateIndex
CREATE INDEX "storage_usage_history_recordDate_idx" ON "storage_usage_history"("recordDate");

-- CreateIndex
CREATE INDEX "storage_usage_history_period_idx" ON "storage_usage_history"("period");

-- CreateIndex
CREATE UNIQUE INDEX "storage_usage_history_organisationId_period_recordDate_key" ON "storage_usage_history"("organisationId", "period", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_planName_key" ON "subscription_plans"("planName");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_planCode_key" ON "subscription_plans"("planCode");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

-- CreateIndex
CREATE INDEX "subscription_plans_displayOrder_idx" ON "subscription_plans"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_features_featureKey_key" ON "subscription_features"("featureKey");

-- CreateIndex
CREATE INDEX "subscription_features_featureKey_idx" ON "subscription_features"("featureKey");

-- CreateIndex
CREATE INDEX "subscription_features_category_idx" ON "subscription_features"("category");

-- CreateIndex
CREATE INDEX "subscription_plan_features_planId_idx" ON "subscription_plan_features"("planId");

-- CreateIndex
CREATE INDEX "subscription_plan_features_featureKey_idx" ON "subscription_plan_features"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_features_planId_featureKey_key" ON "subscription_plan_features"("planId", "featureKey");

-- CreateIndex
CREATE INDEX "organisation_subscriptions_organisationId_idx" ON "organisation_subscriptions"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_subscriptions_planId_idx" ON "organisation_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "organisation_subscriptions_status_idx" ON "organisation_subscriptions"("status");

-- CreateIndex
CREATE INDEX "organisation_subscriptions_expiryDate_idx" ON "organisation_subscriptions"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_requests_requestNumber_key" ON "subscription_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "subscription_requests_organisationId_idx" ON "subscription_requests"("organisationId");

-- CreateIndex
CREATE INDEX "subscription_requests_status_idx" ON "subscription_requests"("status");

-- CreateIndex
CREATE INDEX "subscription_requests_requestType_idx" ON "subscription_requests"("requestType");

-- CreateIndex
CREATE INDEX "subscription_requests_createdAt_idx" ON "subscription_requests"("createdAt");

-- CreateIndex
CREATE INDEX "subscription_history_organisationId_idx" ON "subscription_history"("organisationId");

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_idx" ON "subscription_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_history_action_idx" ON "subscription_history"("action");

-- CreateIndex
CREATE INDEX "subscription_history_createdAt_idx" ON "subscription_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_eventId_key" ON "audit_logs"("eventId");

-- CreateIndex
CREATE INDEX "audit_logs_organisationId_idx" ON "audit_logs"("organisationId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_idx" ON "audit_logs"("resourceType");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_eventId_idx" ON "audit_logs"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticketCode_key" ON "support_tickets"("ticketCode");

-- CreateIndex
CREATE INDEX "support_tickets_organisationId_idx" ON "support_tickets"("organisationId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_ticket_replies_ticketId_idx" ON "support_ticket_replies"("ticketId");

-- CreateIndex
CREATE INDEX "document_templates_organisationId_idx" ON "document_templates"("organisationId");

-- CreateIndex
CREATE INDEX "document_templates_organisationId_status_idx" ON "document_templates"("organisationId", "status");

-- CreateIndex
CREATE INDEX "document_templates_createdById_idx" ON "document_templates"("createdById");

-- CreateIndex
CREATE INDEX "document_template_versions_templateId_idx" ON "document_template_versions"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "document_template_versions_templateId_version_key" ON "document_template_versions"("templateId", "version");

-- CreateIndex
CREATE INDEX "document_template_fields_templateId_idx" ON "document_template_fields"("templateId");

-- CreateIndex
CREATE INDEX "organisation_integrations_organisationId_idx" ON "organisation_integrations"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_integrations_organisationId_status_idx" ON "organisation_integrations"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_integrations_organisationId_provider_key" ON "organisation_integrations"("organisationId", "provider");

-- CreateIndex
CREATE INDEX "integration_logs_organisationId_idx" ON "integration_logs"("organisationId");

-- CreateIndex
CREATE INDEX "integration_logs_organisationId_provider_idx" ON "integration_logs"("organisationId", "provider");

-- CreateIndex
CREATE INDEX "integration_logs_organisationId_createdAt_idx" ON "integration_logs"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "custom_rest_integrations_organisationId_idx" ON "custom_rest_integrations"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_api_keys_keyHash_key" ON "organisation_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "organisation_api_keys_organisationId_idx" ON "organisation_api_keys"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_webhooks_organisationId_idx" ON "organisation_webhooks"("organisationId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_organisationId_idx" ON "webhook_deliveries"("organisationId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_organisationId_createdAt_idx" ON "webhook_deliveries"("organisationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "platform_integrations_provider_key" ON "platform_integrations"("provider");

-- CreateIndex
CREATE INDEX "crm_clients_organisationId_idx" ON "crm_clients"("organisationId");

-- CreateIndex
CREATE INDEX "crm_clients_organisationId_status_idx" ON "crm_clients"("organisationId", "status");

-- CreateIndex
CREATE INDEX "crm_contacts_clientId_idx" ON "crm_contacts"("clientId");

-- CreateIndex
CREATE INDEX "crm_contacts_organisationId_idx" ON "crm_contacts"("organisationId");

-- CreateIndex
CREATE INDEX "crm_documents_clientId_idx" ON "crm_documents"("clientId");

-- CreateIndex
CREATE INDEX "crm_documents_organisationId_idx" ON "crm_documents"("organisationId");

-- CreateIndex
CREATE INDEX "crm_requests_clientId_idx" ON "crm_requests"("clientId");

-- CreateIndex
CREATE INDEX "crm_requests_organisationId_idx" ON "crm_requests"("organisationId");

-- CreateIndex
CREATE INDEX "crm_activities_clientId_idx" ON "crm_activities"("clientId");

-- CreateIndex
CREATE INDEX "crm_activities_organisationId_idx" ON "crm_activities"("organisationId");

-- CreateIndex
CREATE INDEX "crm_notes_clientId_idx" ON "crm_notes"("clientId");

-- CreateIndex
CREATE INDEX "crm_notes_organisationId_idx" ON "crm_notes"("organisationId");

-- CreateIndex
CREATE INDEX "bulk_generation_jobs_organisationId_idx" ON "bulk_generation_jobs"("organisationId");

-- CreateIndex
CREATE INDEX "bulk_generation_jobs_organisationId_status_idx" ON "bulk_generation_jobs"("organisationId", "status");

-- CreateIndex
CREATE INDEX "bulk_generation_records_jobId_idx" ON "bulk_generation_records"("jobId");

-- CreateIndex
CREATE INDEX "document_extractions_organisationId_idx" ON "document_extractions"("organisationId");

-- CreateIndex
CREATE INDEX "document_extractions_organisationId_documentType_idx" ON "document_extractions"("organisationId", "documentType");

-- CreateIndex
CREATE INDEX "signature_envelopes_organisationId_idx" ON "signature_envelopes"("organisationId");

-- CreateIndex
CREATE INDEX "signature_envelopes_organisationId_status_idx" ON "signature_envelopes"("organisationId", "status");

-- CreateIndex
CREATE INDEX "signature_recipients_envelopeId_idx" ON "signature_recipients"("envelopeId");

-- CreateIndex
CREATE INDEX "ai_agent_executions_organisationId_idx" ON "ai_agent_executions"("organisationId");

-- CreateIndex
CREATE INDEX "automation_forms_organisationId_idx" ON "automation_forms"("organisationId");

-- CreateIndex
CREATE INDEX "automation_forms_organisationId_status_idx" ON "automation_forms"("organisationId", "status");

-- CreateIndex
CREATE INDEX "automation_form_submissions_formId_idx" ON "automation_form_submissions"("formId");

-- CreateIndex
CREATE INDEX "automation_form_submissions_organisationId_idx" ON "automation_form_submissions"("organisationId");

-- CreateIndex
CREATE INDEX "crm_sync_logs_organisationId_idx" ON "crm_sync_logs"("organisationId");

-- CreateIndex
CREATE INDEX "crm_sync_logs_organisationId_provider_idx" ON "crm_sync_logs"("organisationId", "provider");

-- CreateIndex
CREATE INDEX "document_comments_documentId_idx" ON "document_comments"("documentId");

-- CreateIndex
CREATE INDEX "document_comments_organisationId_idx" ON "document_comments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionRef_key" ON "payment_transactions"("transactionRef");

-- CreateIndex
CREATE INDEX "payment_transactions_organisationId_idx" ON "payment_transactions"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_usage_snapshots_organisationId_period_key" ON "organisation_usage_snapshots"("organisationId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_code_key" ON "feature_flags"("code");

-- CreateIndex
CREATE INDEX "feature_flags_code_idx" ON "feature_flags"("code");

-- CreateIndex
CREATE INDEX "platform_announcements_isActive_idx" ON "platform_announcements"("isActive");

-- CreateIndex
CREATE INDEX "emergency_access_logs_superAdminId_idx" ON "emergency_access_logs"("superAdminId");

-- CreateIndex
CREATE INDEX "emergency_access_logs_organisationId_idx" ON "emergency_access_logs"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "governance_change_requests_changeRequestId_key" ON "governance_change_requests"("changeRequestId");

-- CreateIndex
CREATE INDEX "governance_change_requests_organisationId_idx" ON "governance_change_requests"("organisationId");

-- CreateIndex
CREATE INDEX "governance_change_requests_status_idx" ON "governance_change_requests"("status");

-- CreateIndex
CREATE INDEX "governance_change_requests_changeType_idx" ON "governance_change_requests"("changeType");

-- CreateIndex
CREATE INDEX "access_review_campaigns_organisationId_idx" ON "access_review_campaigns"("organisationId");

-- CreateIndex
CREATE INDEX "access_review_campaigns_status_idx" ON "access_review_campaigns"("status");

-- CreateIndex
CREATE INDEX "access_review_items_campaignId_idx" ON "access_review_items"("campaignId");

-- CreateIndex
CREATE INDEX "access_review_items_userId_idx" ON "access_review_items"("userId");

-- CreateIndex
CREATE INDEX "access_review_items_status_idx" ON "access_review_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "governance_incidents_incidentNumber_key" ON "governance_incidents"("incidentNumber");

-- CreateIndex
CREATE INDEX "governance_incidents_organisationId_idx" ON "governance_incidents"("organisationId");

-- CreateIndex
CREATE INDEX "governance_incidents_status_idx" ON "governance_incidents"("status");

-- CreateIndex
CREATE INDEX "governance_incidents_severity_idx" ON "governance_incidents"("severity");

-- CreateIndex
CREATE INDEX "governance_incident_history_incidentId_idx" ON "governance_incident_history"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "governance_risks_riskId_key" ON "governance_risks"("riskId");

-- CreateIndex
CREATE INDEX "governance_risks_organisationId_idx" ON "governance_risks"("organisationId");

-- CreateIndex
CREATE INDEX "governance_risks_status_idx" ON "governance_risks"("status");

-- CreateIndex
CREATE INDEX "governance_risks_severity_idx" ON "governance_risks"("severity");

-- CreateIndex
CREATE INDEX "governance_risk_history_riskId_idx" ON "governance_risk_history"("riskId");

-- AddForeignKey
ALTER TABLE "organisation_locations" ADD CONSTRAINT "organisation_locations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "organisation_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_invitations" ADD CONSTRAINT "organisation_invitations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_tool_runs" ADD CONSTRAINT "department_ai_tool_runs_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_tool_runs" ADD CONSTRAINT "department_ai_tool_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_templates" ADD CONSTRAINT "department_ai_templates_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_templates" ADD CONSTRAINT "department_ai_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_extracted_records" ADD CONSTRAINT "department_ai_extracted_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "department_ai_tool_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_extracted_records" ADD CONSTRAINT "department_ai_extracted_records_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ai_extracted_records" ADD CONSTRAINT "department_ai_extracted_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_ai_model_assignments" ADD CONSTRAINT "organization_ai_model_assignments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_ai_model_assignments" ADD CONSTRAINT "organization_ai_model_assignments_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_profiles" ADD CONSTRAINT "ocr_profiles_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ocr_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ocr_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ocr_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_cost_usage" ADD CONSTRAINT "ocr_cost_usage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ocr_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_cost_usage" ADD CONSTRAINT "ocr_cost_usage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ocr_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_logs" ADD CONSTRAINT "ocr_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ocr_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_logs" ADD CONSTRAINT "ocr_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ocr_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_service_health" ADD CONSTRAINT "ocr_service_health_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ocr_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_requests" ADD CONSTRAINT "ocr_requests_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "ocr_engines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs_queue" ADD CONSTRAINT "ai_jobs_queue_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs_queue" ADD CONSTRAINT "ai_jobs_queue_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ai_jobs_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cost_usage" ADD CONSTRAINT "ai_cost_usage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cost_usage" ADD CONSTRAINT "ai_cost_usage_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_service_health" ADD CONSTRAINT "ai_service_health_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_features" ADD CONSTRAINT "subscription_plan_features_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "subscription_features"("featureKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_subscriptions" ADD CONSTRAINT "organisation_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_requests" ADD CONSTRAINT "subscription_requests_currentPlanId_fkey" FOREIGN KEY ("currentPlanId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_requests" ADD CONSTRAINT "subscription_requests_requestedPlanId_fkey" FOREIGN KEY ("requestedPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "organisation_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_oldPlanId_fkey" FOREIGN KEY ("oldPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_newPlanId_fkey" FOREIGN KEY ("newPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_replies" ADD CONSTRAINT "support_ticket_replies_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template_versions" ADD CONSTRAINT "document_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template_versions" ADD CONSTRAINT "document_template_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template_fields" ADD CONSTRAINT "document_template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_integrations" ADD CONSTRAINT "organisation_integrations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_integrations" ADD CONSTRAINT "organisation_integrations_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "organisation_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_rest_integrations" ADD CONSTRAINT "custom_rest_integrations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_api_keys" ADD CONSTRAINT "organisation_api_keys_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_api_keys" ADD CONSTRAINT "organisation_api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_webhooks" ADD CONSTRAINT "organisation_webhooks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_webhooks" ADD CONSTRAINT "organisation_webhooks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "organisation_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_requests" ADD CONSTRAINT "crm_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_generation_records" ADD CONSTRAINT "bulk_generation_records_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "bulk_generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_recipients" ADD CONSTRAINT "signature_recipients_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_form_submissions" ADD CONSTRAINT "automation_form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "automation_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_review_items" ADD CONSTRAINT "access_review_items_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "access_review_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_incident_history" ADD CONSTRAINT "governance_incident_history_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "governance_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_risk_history" ADD CONSTRAINT "governance_risk_history_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "governance_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

