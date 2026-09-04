"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Image as ImageIcon, Paperclip, Folder, HardDrive, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import apiClient from "@/lib/axios";

export default function OrganizationStorageDetailPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    async function loadOrg() {
      if (!params?.id) return;
      try {
        setLoading(true);
        const res = await apiClient.get(`/super-admin/organisations/${params.id}`);
        if (res.data?.data) {
          const o = res.data.data;
          const quotaGB = Number(o.subscription?.customStorageLimitGB || o.subscription?.plan?.storageLimitGB || 10);
          const usedGB = Number(parseFloat(o.storage_used || "0").toFixed(2));
          const availableGB = Math.max(0, quotaGB - usedGB);
          const pct = quotaGB > 0 ? Math.min(100, Math.round((usedGB / quotaGB) * 100)) : 0;
          setOrg({
            id: String(o.id),
            name: o.name,
            plan: o.plan || o.subscription?.plan?.planName || "Starter",
            usedGB,
            quotaGB,
            availableGB: Number(availableGB.toFixed(2)),
            usagePercent: pct,
            totalDocuments: o._count?.documents || o.documentsCount || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load organization storage details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans text-slate-500">
        <RefreshCw size={20} className="animate-spin text-[#274690]" />
        <span className="ml-2 text-xs font-bold">Loading organization storage metrics...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-8 text-center font-sans space-y-4">
        <h2 className="text-base font-bold text-slate-800">Organization Not Found</h2>
        <Link
          href="/super-admin/storage/organizations"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-xs font-bold">{org.plan} Plan</Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            🏢 {org.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Organization Cloud Storage Metrics & Vault Overview</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 text-xs font-bold rounded-xl" asChild>
          <Link href="/super-admin/storage/organizations">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Organizations
          </Link>
        </Button>
      </div>

      {/* Storage Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-5">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Storage Used</p>
          <p className="mt-2 text-2xl font-black text-[#274690]">{org.usedGB} GB</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-5">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Storage Quota</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{org.quotaGB} GB</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-5">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Available Storage</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{org.availableGB} GB</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-5">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Quota Utilization</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{org.usagePercent}%</p>
        </Card>
      </section>

      {/* Storage Breakdown & Namespace Isolation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
          <CardTitle className="text-base font-black text-slate-900">Tenant Namespace Isolation</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            AWS S3 multi-tenant storage partition assigned to this organization.
          </CardDescription>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <span className="font-bold text-slate-700">S3 Key Namespace:</span>
            <p className="font-mono text-[11px] text-[#274690] bg-white p-2 rounded border border-slate-200">
              {org.id}/documents/&#123;documentId&#125;/original/...
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Storage Provider:</span>
              <span className="font-bold text-slate-900">AWS S3 (Platform Vault)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Encryption:</span>
              <span className="font-bold text-emerald-700">SSE-S3 / AES-256</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Public Access:</span>
              <span className="font-bold text-rose-700">Blocked (Private Bucket)</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
          <CardTitle className="text-base font-black text-slate-900">Quota Policy</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Automatic subscription quota enforcement status.
          </CardDescription>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 leading-relaxed">
              New document uploads are strictly limited by: <code className="font-mono font-bold text-[#274690]">Current Usage + File Size ≤ {org.quotaGB} GB</code>.
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  org.usagePercent >= 100 ? "bg-rose-500" : org.usagePercent >= 80 ? "bg-amber-500" : "bg-[#274690]"
                }`}
                style={{ width: `${Math.min(100, org.usagePercent)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-right">
              {org.usedGB} GB of {org.quotaGB} GB utilized ({org.usagePercent}%)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
