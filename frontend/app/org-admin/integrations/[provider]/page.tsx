"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plug,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  FolderPlus,
  Upload,
  List,
  Send,
  ExternalLink,
  ShieldCheck,
  Mail,
  Smartphone,
  Cloud,
  Layers,
  Clock,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import integrationsApi, {
  type IntegrationProviderMeta,
  DEFAULT_TENANT_INTEGRATIONS,
} from "@/services/integrationsApi";

export default function IntegrationDetailPage() {
  const params = useParams();
  const providerSlug = String(params?.provider || "");

  const initialMeta = DEFAULT_TENANT_INTEGRATIONS.find(
    (p) => p.slug === providerSlug.toLowerCase() || p.id.toLowerCase() === providerSlug.toLowerCase()
  ) || DEFAULT_TENANT_INTEGRATIONS[0];

  const [provider, setProvider] = useState<IntegrationProviderMeta | null>(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General Connection Test Result
  const [testResult, setTestResult] = useState<any>(null);

  // Google Workspace States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [uploadedDriveResult, setUploadedDriveResult] = useState<any>(null);

  // Slack States
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [slackTargetChannel, setSlackTargetChannel] = useState("#general");
  const [slackMessageText, setSlackMessageText] = useState("🚀 DocuCore automated alert: Connection test passed!");
  const [slackMessageResult, setSlackMessageResult] = useState<any>(null);

  // SMTP States
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [smtpEmailResult, setSmtpEmailResult] = useState<any>(null);

  // WhatsApp States
  const [waTestPhone, setWaTestPhone] = useState("+919876543210");
  const [waTestMessage, setWaTestMessage] = useState("DocuCore: Document approval requested for Contract #9981.");
  const [waResult, setWaResult] = useState<any>(null);

  // S3 Upload Test
  const [uploadedS3Result, setUploadedS3Result] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProviderDetails = async () => {
    try {
      const res = await integrationsApi.getIntegrationById(providerSlug);
      if (res?.data) {
        setProvider(res.data);
      }
    } catch (err: any) {
      console.warn("Notice loading provider:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (providerSlug) {
      const fallback = DEFAULT_TENANT_INTEGRATIONS.find(
        (p) => p.slug === providerSlug.toLowerCase() || p.id.toLowerCase() === providerSlug.toLowerCase()
      );
      if (fallback) setProvider(fallback);
      loadProviderDetails();
    }
  }, [providerSlug]);

  const handleOneClickOAuth = async () => {
    if (!provider) return;
    setActionLoading("connect_oauth");
    try {
      const res: any = await integrationsApi.connect(provider.slug || provider.id);
      const authUrl = res?.authUrl || res?.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
        return;
      }
      if (res?.success) {
        showToast(`Connected to ${provider.name}!`);
        loadProviderDetails();
      } else {
        showToast(res?.message || "OAuth initiation failed");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "OAuth connection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateManagedService = async () => {
    if (!provider) return;
    setActionLoading("managed_service");
    try {
      const res = await integrationsApi.connect(provider.slug || provider.id, { mode: "DOCUCORE_MANAGED" });
      if (res.success) {
        showToast(`✓ ${provider.name} activated successfully for your organization!`);
        loadProviderDetails();
      } else {
        showToast(res.message || "Activation failed");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Activation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestConnection = async () => {
    if (!provider) return;
    setActionLoading("test_connection");
    try {
      const res = await integrationsApi.testConnection(provider.id);
      setTestResult(res);
      if (res.success) {
        showToast("✓ Connection verified successfully!");
      } else {
        showToast(`Notice: ${res.data?.error || res.message || "Connection test failed"}`);
      }
      loadProviderDetails();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!provider) return;
    if (!confirm(`Are you sure you want to disconnect ${provider.name}?`)) return;
    setActionLoading("disconnect");
    try {
      await integrationsApi.disconnect(provider.id);
      showToast(`Disconnected ${provider.name}`);
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Google Workspace Actions
  const handleListDriveFiles = async () => {
    if (!provider) return;
    setActionLoading("list_files");
    try {
      const res = await integrationsApi.executeAction(provider.id, "list_files", { pageSize: 15 });
      setDriveFiles(res.data?.files || []);
      showToast(`Fetched ${res.data?.files?.length || 0} items from Google Drive.`);
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadDriveContract = async () => {
    if (!provider) return;
    setActionLoading("upload_document");
    try {
      const samplePdfContent =
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
        "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj\n" +
        "4 0 obj<</Length 120>>stream\nBT /F1 18 Tf 50 700 Td (DocuCore Verification Document) Tj ET\n" +
        `BT /F1 12 Tf 50 670 Td (Uploaded on ${new Date().toLocaleString()}) Tj ET\n` +
        "endstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\n0000000210 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n380\n%%EOF";

      const res = await integrationsApi.executeAction(provider.id, "upload_document", {
        fileName: `DocuCore_Enterprise_Agreement_${Date.now()}.pdf`,
        buffer: samplePdfContent,
        mimeType: "application/pdf",
      });

      setUploadedDriveResult(res.data);
      showToast("PDF Contract uploaded to Google Drive!");
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Slack Actions
  const handleListSlackChannels = async () => {
    if (!provider) return;
    setActionLoading("list_channels");
    try {
      const res = await integrationsApi.executeAction(provider.id, "list_channels", {});
      setSlackChannels(res.data?.channels || []);
      showToast(`Retrieved ${res.data?.channels?.length || 0} Slack channels.`);
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendSlackNotification = async () => {
    if (!provider) return;
    setActionLoading("send_message");
    try {
      const res = await integrationsApi.executeAction(provider.id, "send_message", {
        channel: slackTargetChannel,
        message: slackMessageText,
      });
      setSlackMessageResult(res.data);
      showToast("Slack notification delivered!");
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // S3 Upload Action
  const handleTestS3Upload = async () => {
    if (!provider) return;
    setActionLoading("s3_upload");
    try {
      const res = await integrationsApi.executeAction(provider.id, "upload_document", {
        fileName: `contracts/org_contract_${Date.now()}.pdf`,
        content: "DocuCore Automated Storage Payload",
        mimeType: "application/pdf",
      });
      setUploadedS3Result(res.data);
      showToast("Document saved to cloud storage!");
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // SMTP Email Action
  const handleSendTestEmail = async () => {
    if (!provider) return;
    setActionLoading("send_test_email");
    try {
      const res = await integrationsApi.executeAction(provider.id, "send_email", {
        to: smtpTestRecipient || "admin@example.com",
        subject: "DocuCore Automated Contract Approval Notification",
        html: "<p>This is a live transactional email sent via DocuCore Enterprise Platform.</p>",
      });
      setSmtpEmailResult(res.data);
      showToast("Transactional notification dispatched!");
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // WhatsApp Action
  const handleSendWhatsAppAlert = async () => {
    if (!provider) return;
    setActionLoading("send_wa");
    try {
      const res = await integrationsApi.executeAction(provider.id, "send_notification", {
        to: waTestPhone,
        message: waTestMessage,
      });
      setWaResult(res.data);
      showToast("WhatsApp alert sent!");
      loadProviderDetails();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans text-slate-500">
        <RotateCw size={20} className="animate-spin text-[#274690]" />
        <span className="ml-2 text-xs font-bold">Loading provider information...</span>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-8 text-center font-sans space-y-4">
        <AlertCircle size={32} className="mx-auto text-amber-500" />
        <h2 className="text-base font-bold text-slate-800">Integration Provider Not Found</h2>
        <Link
          href="/org-admin/integrations"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Integrations Catalog
        </Link>
      </div>
    );
  }

  const isConnected = provider.status === "CONNECTED";
  const isNotAvailable = provider.status === "NOT_CONFIGURED" || provider.isPlatformAvailable === false;
  const isReadyToConnect = provider.status === "READY_TO_CONNECT" || (!isConnected && !isNotAvailable);

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all">
          {toastMessage}
        </div>
      )}

      {/* Back button */}
      <div>
        <Link
          href="/org-admin/integrations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#274690] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Integrations Catalog
        </Link>
      </div>

      {/* Provider Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            {provider.icon ? (
              <img
                src={provider.icon}
                alt={provider.name}
                className="h-12 w-12 rounded-xl object-contain p-1.5 border border-slate-200 bg-slate-50"
              />
            ) : (
              <Layers className="h-12 w-12 text-slate-700 p-2.5 bg-slate-100 rounded-xl border border-slate-200" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{provider.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-800"
                      : isReadyToConnect
                      ? "bg-blue-100 text-[#274690]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 size={11} /> Connected
                    </>
                  ) : isReadyToConnect ? (
                    <>
                      <Sparkles size={11} /> Ready to Connect
                    </>
                  ) : (
                    "Not Available"
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">{provider.description}</p>

              {isConnected && provider.connectedRecord && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="font-semibold text-emerald-700">
                    Connected Account: {provider.connectedRecord.accountEmail || provider.connectedRecord.accountName || "Active & Verified"}
                  </span>
                  {provider.connectedRecord.connectedAt && (
                    <span className="text-slate-400">
                      Connected on: {new Date(provider.connectedRecord.connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <>
                {provider.authType === "OAUTH2" && (
                  <button
                    type="button"
                    onClick={handleOneClickOAuth}
                    disabled={actionLoading === "connect_oauth"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#274690] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <Plug size={13} />
                    Reconnect Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={actionLoading === "test_connection"}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw size={13} className={actionLoading === "test_connection" ? "animate-spin" : ""} />
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={actionLoading === "disconnect"}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : isNotAvailable ? (
              <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
                Disabled by Platform Admin
              </span>
            ) : provider.authType === "OAUTH2" ? (
              <button
                type="button"
                onClick={handleOneClickOAuth}
                disabled={actionLoading === "connect_oauth"}
                className="inline-flex items-center gap-2 rounded-xl bg-[#274690] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1f3561] disabled:opacity-50 shadow-md transition-all cursor-pointer"
              >
                <Plug size={14} />
                {provider.id === "GOOGLE_WORKSPACE"
                  ? "Connect with Google"
                  : provider.id === "MICROSOFT_365"
                  ? "Connect with Microsoft"
                  : provider.id === "SLACK"
                  ? "Connect Slack"
                  : provider.id === "MICROSOFT_TEAMS"
                  ? "Connect Microsoft Teams"
                  : "Connect via OAuth"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivateManagedService}
                disabled={actionLoading === "managed_service"}
                className="inline-flex items-center gap-2 rounded-xl bg-[#274690] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1f3561] shadow-md transition-all cursor-pointer"
              >
                <Plug size={14} />
                {provider.id === "AWS_S3"
                  ? "Enable S3 Storage"
                  : provider.id === "SMTP_EMAIL"
                  ? "Enable Email Service"
                  : "Enable WhatsApp"}
              </button>
            )}
          </div>
        </div>

        {/* Not Available Alert */}
        {isNotAvailable && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={15} /> Currently Unavailable
            </div>
            <p>
              {provider.platformNotice || `${provider.name} is currently unavailable. Please contact your platform administrator.`}
            </p>
          </div>
        )}
      </div>

      {/* INTERACTIVE MANUAL TEST PANELS (When Connected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Prominent Connect Banner when Disconnected */}
          {!isConnected && !isNotAvailable && (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-8 text-center space-y-4 shadow-xs">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-xs border border-blue-100 flex items-center justify-center text-[#274690]">
                <Plug size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {provider.authType === "OAUTH2" ? `Connect ${provider.name} Account` : `Enable ${provider.name}`}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {provider.authType === "OAUTH2"
                    ? `Click below to authorize DocuCore AI with your ${provider.name} account via 1-Click OAuth.`
                    : `Click below to activate ${provider.name} for your organization.`}
                </p>
              </div>
              {provider.authType === "OAUTH2" ? (
                <button
                  type="button"
                  onClick={handleOneClickOAuth}
                  disabled={actionLoading === "connect_oauth"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#274690] hover:bg-[#1f3561] px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-900/10 transition-all cursor-pointer"
                >
                  <Plug size={15} />
                  {actionLoading === "connect_oauth"
                    ? "Redirecting..."
                    : provider.id === "GOOGLE_WORKSPACE"
                    ? "Connect with Google"
                    : provider.id === "MICROSOFT_365"
                    ? "Connect with Microsoft"
                    : `Connect ${provider.name}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateManagedService}
                  disabled={actionLoading === "managed_service"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#274690] hover:bg-[#1f3561] px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-900/10 transition-all cursor-pointer"
                >
                  <Plug size={15} />
                  {actionLoading === "managed_service" ? "Activating..." : `Enable ${provider.name}`}
                </button>
              )}
            </div>
          )}

          {/* 1. GOOGLE WORKSPACE */}
          {provider.id === "GOOGLE_WORKSPACE" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h2 className="text-sm font-black text-slate-900">Google Workspace Interactive Console</h2>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">1. List Drive Files</h3>
                    <p className="text-[11px] text-slate-500">Fetch files and folders from your connected Google Drive.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleListDriveFiles}
                    disabled={!isConnected || actionLoading === "list_files"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    <List size={13} /> {actionLoading === "list_files" ? "Fetching..." : "Fetch Files"}
                  </button>
                </div>

                {driveFiles.length > 0 && (
                  <div className="rounded-lg border border-slate-100 overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {driveFiles.map((f: any) => (
                          <tr key={f.id}>
                            <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-xs">{f.name}</td>
                            <td className="py-1.5 px-3 text-slate-500">{f.isFolder ? "Folder" : "File"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">2. Upload Generated Contract</h3>
                    <p className="text-[11px] text-slate-500">Save test contract PDF directly to your connected Google Drive.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadDriveContract}
                    disabled={!isConnected || actionLoading === "upload_document"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                  >
                    <Upload size={13} /> {actionLoading === "upload_document" ? "Uploading..." : "Upload PDF"}
                  </button>
                </div>

                {uploadedDriveResult && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                    <p className="font-bold">✓ Upload Succeeded!</p>
                    <p className="text-[11px]">File: {uploadedDriveResult.fileName} (ID: <code>{uploadedDriveResult.fileId}</code>)</p>
                    {uploadedDriveResult.webViewLink && (
                      <a href={uploadedDriveResult.webViewLink} target="_blank" rel="noopener noreferrer" className="text-[#274690] font-bold hover:underline text-[11px]">
                        Open in Google Drive ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SLACK */}
          {provider.id === "SLACK" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h2 className="text-sm font-black text-slate-900">Slack Dispatch Console</h2>
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">List Channels</h3>
                  <button
                    type="button"
                    onClick={handleListSlackChannels}
                    disabled={!isConnected || actionLoading === "list_channels"}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {actionLoading === "list_channels" ? "Fetching..." : "Fetch Channels"}
                  </button>
                </div>
                {slackChannels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {slackChannels.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSlackTargetChannel(c.id)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                          slackTargetChannel === c.id ? "bg-[#274690] text-white" : "bg-slate-50"
                        }`}
                      >
                        #{c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900">Send Message</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slackMessageText}
                    onChange={(e) => setSlackMessageText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendSlackNotification}
                    disabled={!isConnected || actionLoading === "send_message"}
                    className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. SMTP & EMAIL */}
          {provider.id === "SMTP_EMAIL" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h2 className="text-sm font-black text-slate-900">SMTP Transactional Email Console</h2>
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900">Dispatch Verification Email</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Recipient email address..."
                    value={smtpTestRecipient}
                    onChange={(e) => setSmtpTestRecipient(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={!isConnected || actionLoading === "send_test_email"}
                    className="rounded-lg bg-[#274690] px-4 py-1.5 text-xs font-bold text-white shrink-0 disabled:opacity-50"
                  >
                    Send Email
                  </button>
                </div>

                {smtpEmailResult && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                    ✓ Email Sent! Message ID: <code className="font-mono">{smtpEmailResult.messageId}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. WHATSAPP */}
          {provider.id === "WHATSAPP_BUSINESS" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h2 className="text-sm font-black text-slate-900">WhatsApp Business API Console</h2>
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900">Send Document Alert</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Phone Number (E.164)</label>
                    <input
                      type="text"
                      value={waTestPhone}
                      onChange={(e) => setWaTestPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Notification Text</label>
                    <input
                      type="text"
                      value={waTestMessage}
                      onChange={(e) => setWaTestMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsAppAlert}
                  disabled={!isConnected || actionLoading === "send_wa"}
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Dispatch WhatsApp Alert
                </button>

                {waResult && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                    ✓ WhatsApp Message Sent! ID: <code className="font-mono">{waResult.messageId}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Test Connection Result Box */}
          {testResult && (
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                testResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-rose-50 border-rose-200 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  Live Connection Test: {testResult.status || (testResult.success ? "CONNECTED" : "FAILED")}
                </span>
                {testResult.latencyMs && <span className="text-[11px] opacity-75">{testResult.latencyMs}ms</span>}
              </div>
              <p className="text-[11px]">{testResult.message || testResult.error || JSON.stringify(testResult.data)}</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Capabilities & Activity Logs */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#274690]">Supported Actions</h3>
            <ul className="divide-y divide-slate-100 text-xs text-slate-700">
              {(provider.actions || []).map((act) => (
                <li key={act.id} className="py-2.5">
                  <p className="font-bold text-slate-900">{act.name}</p>
                  <p className="text-[11px] text-slate-500">{act.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock size={13} /> Activity Logs
              </h3>
              <button type="button" onClick={loadProviderDetails} className="text-[11px] font-bold text-[#274690] hover:underline">
                Refresh
              </button>
            </div>

            {(!provider.logs || provider.logs.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No integration activity logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {provider.logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold ${
                          log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      <span>{log.executionTimeMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
