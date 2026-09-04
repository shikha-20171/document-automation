const { storageRepository } = require("../repositories");

/**
 * Storage Service
 * Handles cloud storage management, quota allocations, backup jobs, and alert triggers
 */

const storageService = {
  /**
   * Get global storage config
   */
  async getStorageConfig() {
    return await storageRepository.getStorageConfig();
  },

  /**
   * Update storage configuration
   */
  async updateStorageConfig(id, configData) {
    return await storageRepository.updateStorageConfig(id, configData);
  },

  /**
   * Get organisation storage usage
   */
  async getOrganisationUsage(organisationId) {
    return await storageRepository.getOrgStorageUsage(organisationId);
  },

  /**
   * Get all organizations storage usages (Super Admin)
   */
  async getAllOrganisationUsages() {
    return await storageRepository.getAllOrgStorageUsages();
  },

  /**
   * Update organisation quota or sync used bytes
   */
  async updateOrganisationQuota(organisationId, { quotaGB }) {
    const quotaBytes = BigInt(quotaGB) * BigInt(1024 * 1024 * 1024);
    return await storageRepository.updateOrgStorageUsage(organisationId, { quotaBytes });
  },

  /**
   * Get all storage backups
   */
  async getBackups(params) {
    return await storageRepository.getBackups(params);
  },

  /**
   * Trigger a new storage backup
   */
  async triggerBackup(backupData) {
    return await storageRepository.createBackup({
      backupName: backupData.backupName || `BACKUP-${Date.now()}`,
      backupType: backupData.backupType || "FULL",
      status: "COMPLETED",
      sizeGB: backupData.sizeGB || 1.2,
      location: backupData.location || "S3",
      retentionDays: backupData.retentionDays || 30,
    });
  },

  /**
   * Get storage alerts
   */
  async getStorageAlerts() {
    return await storageRepository.getStorageAlerts();
  },
};

module.exports = storageService;
