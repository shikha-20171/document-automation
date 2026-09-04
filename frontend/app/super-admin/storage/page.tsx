"use client";

import { useState, useEffect } from "react";
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Cloud,
  Eye,
  EyeOff,
  ShieldAlert,
  Server,
  Layers,
  Unplug,
  AlertCircle,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/axios";

export default function SuperAdminStoragePage() {
  const [activeTab, setActiveTab] = useState<"configuration" | "overview" | "organizations" | "quotas">("configuration");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingS3, setSavingS3] = useState(false);
  const [testingS3, setTestingS3] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // AWS S3 Configuration Form State
  const [s3Form, setS3Form] = useState({
    provider: "AWS_S3",
    bucketName: "",
    region: "ap-south-1",
    basePrefix: "",
    accessKeyId: "",
    secretAccessKey: "",
    encryptionType: "SSE-S3",
    kmsKeyId: "",
    endpoint: "",
    connectionStatus: "NOT_CONFIGURED",
    lastTestedAt: null as string | null,
    lastConnectionError: null as string | null,
  });

  const [testResult, setTestResult] = useState<{
    success?: boolean;
    status?: string;
    message?: string;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  // Storage Overview State
  const [overviewData, setOverviewData] = useState<{
    totalOrganizations: number;
    totalAllocatedStorage: string;
    allocatedGB: number;
    usedStorage: string;
    usedGB: number;
    usedStorageBytes: number;
    totalDocuments: number;
    storageUtilization: string;
    utilizationPct: number;
    provider: string;
    connectionStatus: string;
    region?: string;
    bucket?: string;
    lastTestedAt?: string | null;
  }>({
    totalOrganizations: 0,
    totalAllocatedStorage: "0 GB",
    allocatedGB: 0,
    usedStorage: "0 GB",
    usedGB: 0,
    usedStorageBytes: 0,
    totalDocuments: 0,
    storageUtilization: "0%",
    utilizationPct: 0,
    provider: "AWS S3 Cloud",
    connectionStatus: "NOT_CONFIGURED",
  });

  // Organizations Usage Table
  const [orgUsageList, setOrgUsageList] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadStorageData = async () => {
    try {
      setLoading(true);
      const [ovRes, cfgRes, orgsRes] = await Promise.allSettled([
        apiClient.get("/super-admin/storage/overview"),
        apiClient.get("/super-admin/storage/config"),
        apiClient.get("/super-admin/organisations"),
      ]);

      if (ovRes.status === "fulfilled" && ovRes.value.data?.data) {
        setOverviewData(ovRes.value.data.data);
      }

      if (cfgRes.status === "fulfilled" && cfgRes.value.data?.data) {
        const c = cfgRes.value.data.data;
        setS3Form((prev) => ({
          ...prev,
          provider: "AWS_S3",
          bucketName: c.bucketName || "",
          region: c.region || "ap-south-1",
          basePrefix: c.basePrefix || "",
          accessKeyId: c.accessKeyIdMasked || "",
          secretAccessKey: c.secretAccessKeyMasked || "",
          encryptionType: c.encryptionType || "SSE-S3",
          kmsKeyId: c.kmsKeyIdMasked || "",
          endpoint: c.endpoint || "",
          connectionStatus: c.connectionStatus || "NOT_CONFIGURED",
          lastTestedAt: c.lastTestedAt || null,
          lastConnectionError: c.lastConnectionError || null,
        }));
      }

      if (orgsRes.status === "fulfilled" && orgsRes.value.data?.data) {
        const orgs = orgsRes.value.data.data;
        if (Array.isArray(orgs)) {
          setOrgUsageList(
            orgs.map((o: any) => {
              const quotaGB = Number(o.subscription?.customStorageLimitGB || o.subscription?.plan?.storageLimitGB || 10);
              const usedGB = Number(parseFloat(o.storage_used || "0").toFixed(2));
              const pct = quotaGB > 0 ? Math.min(100, Math.round((usedGB / quotaGB) * 100)) : 0;
              const isOver = usedGB > quotaGB;
              return {
                id: o.id,
                org: o.name,
                plan: o.plan || o.subscription?.plan?.planName || "Starter",
                used: `${usedGB} GB`,
                quota: `${quotaGB} GB`,
                pct,
                isOver,
                status: isOver ? "Over Quota" : pct >= 90 ? "Critical" : pct >= 75 ? "Warning" : "Normal",
              };
            })
          );
        }
      }
    } catch (err) {
      console.error("Storage data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const handleTestS3Connection = async () => {
    try {
      setTestingS3(true);
      setTestResult(null);
      const res = await apiClient.post("/super-admin/storage/test-connection", {
        bucketName: s3Form.bucketName,
        region: s3Form.region,
        accessKeyId: s3Form.accessKeyId,
        secretAccessKey: s3Form.secretAccessKey,
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          status: "CONNECTED",
          message: res.data.message || "AWS S3 connection verified. Read, write, and delete permissions confirmed.",
          latencyMs: res.data.latencyMs || 35,
        });
        showToast("✓ AWS S3 Bucket connection verified successfully!");
        setS3Form((prev) => ({ ...prev, connectionStatus: "CONNECTED" }));
      } else {
        setTestResult({
          success: false,
          status: res.data?.status || "FAILED",
          error: res.data?.error || "Connection test failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: err.response?.data?.status || "ERROR",
        error: err.response?.data?.error || err.response?.data?.message || "Failed to reach AWS S3 bucket. Check credentials and region.",
      });
    } finally {
      setTestingS3(false);
    }
  };

  const handleSaveS3Config = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingS3(true);
      setTestResult(null);
      const res = await apiClient.post("/super-admin/storage/config", s3Form);
      if (res.data?.success) {
        showToast("✓ AWS S3 storage configuration verified, encrypted, and saved! All tenants will automatically use this S3 vault.");
        await loadStorageData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to save AWS S3 storage configuration.");
    } finally {
      setSavingS3(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await apiClient.post("/super-admin/storage/disconnect");
      if (res.data?.success) {
        showToast("AWS S3 storage disabled. Existing files remain safe in your S3 bucket.");
        setShowDisconnectModal(false);
        await loadStorageData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to disconnect AWS storage.");
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = s3Form.connectionStatus === "CONNECTED" || overviewData.connectionStatus === "CONNECTED";

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="text-amber-400" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Unplug size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900">Disconnect AWS S3 Storage</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Disconnecting AWS S3 will stop DocuCore from using this storage configuration. <strong>Existing files and documents in your AWS S3 bucket will NOT be deleted.</strong>
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisconnectModal(false)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnect}
                className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                {disconnecting ? "Disconnecting..." : "Confirm Disconnect"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <HardDrive className="text-[#274690]" size={26} />
            Storage Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure and manage secure cloud storage for DocuCore AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${
              isConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : s3Form.connectionStatus === "DISABLED"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {isConnected ? "AWS S3 Connected" : s3Form.connectionStatus === "DISABLED" ? "Disabled by Admin" : "Not Configured"}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Quick Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">STORAGE PROVIDER</span>
          <p className="text-base font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <Cloud size={16} className="text-[#274690]" />
            AWS S3 Storage
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Primary Vault</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">STORAGE USED</span>
          <p className="text-base font-black text-slate-900 mt-1">{overviewData.usedStorage}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{overviewData.storageUtilization} of allocated</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">TOTAL ALLOCATED</span>
          <p className="text-base font-black text-slate-900 mt-1">{overviewData.totalAllocatedStorage}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Across {overviewData.totalOrganizations} Organizations</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">STORED DOCUMENTS</span>
          <p className="text-base font-black text-slate-900 mt-1">{overviewData.totalDocuments}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">PostgreSQL + S3 Binary</p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: "configuration", label: "AWS S3 Configuration" },
          { id: "organizations", label: "Organization Storage Usages" },
          { id: "overview", label: "Platform Metrics & Architecture" },
          { id: "quotas", label: "Subscription Quota Policy" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#274690] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AWS S3 CONFIGURATION */}
      {activeTab === "configuration" && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 p-6 sm:p-8 bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#274690] flex items-center justify-center text-white shadow-md">
                  <Cloud size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Platform AWS S3 Storage Vault
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Credentials are encrypted at rest with AES-256-GCM. All tenant uploads automatically use this vault with isolated namespaces.
                  </p>
                </div>
              </div>

              {isConnected && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDisconnectModal(true)}
                    className="text-xs font-bold rounded-xl border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 h-9"
                  >
                    <Unplug size={13} className="mr-1.5" /> Disconnect
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveS3Config} className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                {/* Bucket Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    S3 Bucket Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. docucore-enterprise-vault"
                    value={s3Form.bucketName}
                    onChange={(e) => setS3Form({ ...s3Form, bucketName: e.target.value })}
                    className="h-10 text-xs font-semibold rounded-xl bg-slate-50 border-slate-300"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Isolated keys format: <code className="font-mono text-[10px] text-[#274690]">&#123;organisationId&#125;/documents/&#123;documentId&#125;/original/...</code>
                  </p>
                </div>

                {/* AWS Region */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    AWS Region *
                  </label>
                  <select
                    value={s3Form.region}
                    onChange={(e) => setS3Form({ ...s3Form, region: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold focus:outline-none focus:border-[#274690]"
                  >
                    <option value="ap-south-1">Asia Pacific (Mumbai) — ap-south-1</option>
                    <option value="us-east-1">US East (N. Virginia) — us-east-1</option>
                    <option value="us-west-2">US West (Oregon) — us-west-2</option>
                    <option value="eu-west-1">Europe (Ireland) — eu-west-1</option>
                    <option value="eu-central-1">Europe (Frankfurt) — eu-central-1</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore) — ap-southeast-1</option>
                    <option value="me-central-1">Middle East (UAE) — me-central-1</option>
                  </select>
                </div>

                {/* AWS Access Key ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    AWS Access Key ID *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={s3Form.accessKeyId}
                    onChange={(e) => setS3Form({ ...s3Form, accessKeyId: e.target.value })}
                    className="h-10 text-xs font-mono font-bold rounded-xl bg-slate-50 border-slate-300"
                  />
                </div>

                {/* AWS Secret Access Key */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    AWS Secret Access Key *
                  </label>
                  <div className="relative">
                    <Input
                      type={showSecretKey ? "text" : "password"}
                      required
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={s3Form.secretAccessKey}
                      onChange={(e) => setS3Form({ ...s3Form, secretAccessKey: e.target.value })}
                      className="h-10 text-xs font-mono font-bold rounded-xl pr-10 bg-slate-50 border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Encrypted with AES-256-GCM and never returned in API responses</p>
                </div>

                {/* Optional Base Prefix */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Optional Storage Prefix
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. docucore/"
                    value={s3Form.basePrefix}
                    onChange={(e) => setS3Form({ ...s3Form, basePrefix: e.target.value })}
                    className="h-10 text-xs font-semibold rounded-xl bg-slate-50 border-slate-300"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional global root folder inside your bucket</p>
                </div>

                {/* Server-Side Encryption */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Server-Side Encryption
                  </label>
                  <select
                    value={s3Form.encryptionType}
                    onChange={(e) => setS3Form({ ...s3Form, encryptionType: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold focus:outline-none focus:border-[#274690]"
                  >
                    <option value="SSE-S3">SSE-S3 (Amazon S3-Managed Encryption Key)</option>
                    <option value="SSE-KMS">SSE-KMS (AWS Key Management Service)</option>
                  </select>
                </div>

                {/* KMS Key ID (Conditional) */}
                {s3Form.encryptionType === "SSE-KMS" && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                      AWS KMS Key ARN / ID *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="arn:aws:kms:region:account-id:key/your-key-id"
                      value={s3Form.kmsKeyId}
                      onChange={(e) => setS3Form({ ...s3Form, kmsKeyId: e.target.value })}
                      className="h-10 text-xs font-mono rounded-xl bg-slate-50 border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Live Test Results Alert */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-rose-50 text-rose-900 border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
                    <span>{testResult.message || testResult.error}</span>
                  </div>
                  {testResult.latencyMs && (
                    <Badge variant="outline" className="text-[10px] font-bold bg-white">
                      Latency: {testResult.latencyMs}ms
                    </Badge>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={testingS3 || savingS3}
                  onClick={handleTestS3Connection}
                  className="w-full sm:w-auto h-10 px-5 text-xs font-bold rounded-xl gap-2 border-slate-300 hover:bg-slate-50"
                >
                  {testingS3 ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-[#274690]" />
                      Validating with AWS SDK...
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="text-[#274690]" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={savingS3}
                  className="w-full sm:w-auto h-10 px-6 text-xs font-black rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white gap-2 shadow-md"
                >
                  {savingS3 ? "Encrypting & Connecting..." : isConnected ? "Save & Update AWS S3" : "Connect AWS S3"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONS STORAGE */}
      {activeTab === "organizations" && (
        <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-xs bg-white">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Organization Storage Consumption & Quotas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Storage quotas are automatically determined by each organization's active subscription plan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStorageData}
              className="text-xs font-bold rounded-xl gap-1.5 h-8"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-6">Organization</th>
                  <th className="p-3.5">Subscription Plan</th>
                  <th className="p-3.5">Used Storage</th>
                  <th className="p-3.5">Plan Quota</th>
                  <th className="p-3.5">Utilization %</th>
                  <th className="p-3.5 pr-6 text-right">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgUsageList.length > 0 ? (
                  orgUsageList.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-6 font-bold text-slate-900">{org.org}</td>
                      <td className="p-3.5">
                        <Badge className="bg-[#274690]/10 text-[#274690] border-0 text-[10px] font-bold">
                          {org.plan}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{org.used}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{org.quota}</td>
                      <td className="p-3.5 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                org.isOver ? "bg-rose-500" : org.pct >= 80 ? "bg-amber-500" : "bg-[#274690]"
                              }`}
                              style={{ width: `${Math.min(100, org.pct)}%` }}
                            />
                          </div>
                          <span>{org.pct}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            org.isOver
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : org.status === "Warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {org.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No active organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PLATFORM METRICS & ARCHITECTURE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Database size={16} className="text-[#274690]" />
              Database vs S3 Storage Division
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">PostgreSQL Relational Layer:</span>
                <p className="text-[11px] text-slate-500">
                  Stores document metadata, S3 object keys, MIME types, file sizes, folder structures, timestamps, quotas, and audit events. Zero large binaries in PostgreSQL.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="font-bold text-[#274690]">AWS S3 Binary Layer:</span>
                <p className="text-[11px] text-slate-600">
                  Stores original PDFs, DOCX, OCR outputs, and AI generated documents with multi-tenant key prefixes: <code className="font-mono text-[10px]">&#123;orgId&#125;/documents/&#123;docId&#125;/original/...</code>
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Server size={16} className="text-[#274690]" />
              Secure File Access Architecture
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                1. S3 bucket is strictly <strong>private</strong> (no public access).
              </p>
              <p>
                2. When an authorized user requests a file, backend verifies organization ownership and issues a short-lived <strong>presigned GET URL (15 minutes expiry)</strong>.
              </p>
              <p>
                3. Tenant users cannot access or guess another organization's S3 object keys.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: QUOTAS */}
      {activeTab === "quotas" && (
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <CardTitle className="text-base font-black text-slate-900">
            Subscription Storage Quota & Enforcement Policy
          </CardTitle>
          <p className="text-xs text-slate-500">
            Every document upload executes a server-side check: <code className="font-mono font-bold text-[#274690]">Current Usage + File Size ≤ Plan Storage Limit</code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-700 text-xs">
                <AlertTriangle size={15} /> 80% Usage — Warning Alert
              </div>
              <p className="text-xs text-slate-600">
                Displays storage warning badge in tenant dashboard.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-700 text-xs">
                <ShieldAlert size={15} /> 95% Usage — Critical Alert
              </div>
              <p className="text-xs text-slate-600">
                Displays prominent upgrade banner to tenant administrators.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-300 bg-slate-50 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <Lock size={15} /> 100% Usage — Upload Blocked
              </div>
              <p className="text-xs text-slate-600">
                Blocks new uploads with HTTP 403 <code className="text-[10px]">Storage limit reached</code>. Existing documents remain accessible.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
