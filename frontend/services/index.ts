// ─── Central HTTP Client ──────────────────────────────────────────────────────
export { api, apiClient, ApiError } from "./api";
export type { ApiResponse } from "./api";

// ─── Resource API Modules ─────────────────────────────────────────────────────
export { authApi } from "./authApi";
export { dashboardApi } from "./dashboardApi";
export { documentsApi } from "./documentsApi";
export { documentVersionsApi } from "./documentVersionsApi";
export { templatesApi } from "./templatesApi";
export { tasksApi } from "./tasksApi";
export { approvalsApi } from "./approvalsApi";
export { aiApi } from "./aiApi";
export { ocrApi } from "./ocrApi";
export { notificationsApi } from "./notificationsApi";
export { activityApi } from "./activityApi";
export { auditApi } from "./auditApi";
export { usersApi } from "./usersApi";
export { teamsApi } from "./teamsApi";
export { departmentsApi } from "./departmentsApi";
export { organizationsApi, organisationApi } from "./organizationsApi";
export { companyApi } from "./companyApi";
export { reportsApi } from "./reportsApi";
export { integrationsApi } from "./integrationsApi";
export { storageApi } from "./storageApi";
export { settingsApi, orgSettingsApi } from "./settingsApi";
export { profileApi } from "./profileApi";
export { supportApi, orgSupportApi } from "./supportApi";
export { workflowApi } from "./workflowApi";
export { analyticsApi, orgAnalyticsApi } from "./analyticsApi";
export { billingApi } from "./billingApi";
export { crmApi } from "./crmApi";
export { eSignatureApi } from "./eSignatureApi";

// ─── Types ────────────────────────────────────────────────────────────────────
export * from "./types/document";
export * from "./types/task";
export * from "./types/template";
export * from "./types/approval";
export * from "./types/ai";
export * from "./types/notification";
export * from "./types/user";
export * from "./types/team";
export * from "./types/organization";
export * from "./types/dashboard";
export * from "./types/support";
