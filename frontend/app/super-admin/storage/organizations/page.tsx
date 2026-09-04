"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Search, Filter, RefreshCw, HardDrive, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/axios";

export default function StorageOrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/super-admin/organisations");
      if (res.data?.data && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((o: any) => {
          const quotaGB = Number(o.subscription?.customStorageLimitGB || o.subscription?.plan?.storageLimitGB || 10);
          const usedGB = Number(parseFloat(o.storage_used || "0").toFixed(2));
          const pct = quotaGB > 0 ? Math.min(100, Math.round((usedGB / quotaGB) * 100)) : 0;
          const isOver = usedGB > quotaGB;
          return {
            id: String(o.id),
            name: o.name,
            plan: o.plan || o.subscription?.plan?.planName || "Starter",
            usedGB,
            quotaGB,
            usagePercent: pct,
            isOver,
            status: isOver ? "Quota Exceeded" : pct >= 80 ? "Near Quota" : "Normal",
          };
        });
        setOrganizations(formatted);
      }
    } catch (err) {
      console.error("Failed to load organizations storage:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "All" || org.plan === planFilter;
    const matchesStatus = statusFilter === "All" || org.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalOrgs = organizations.length;
  const nearQuotaCount = organizations.filter((o) => o.status === "Near Quota").length;
  const quotaExceededCount = organizations.filter((o) => o.status === "Quota Exceeded").length;

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Top Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Organizations</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalOrgs}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Near Quota (&gt;80%)</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{nearQuotaCount}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Quota Exceeded</p>
          <p className="mt-2 text-2xl font-black text-rose-600">{quotaExceededCount}</p>
        </Card>
      </section>

      {/* Filter and Table Container */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-slate-300"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none"
            >
              <option value="All">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Near Quota">Near Quota</option>
              <option value="Quota Exceeded">Quota Exceeded</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOrganizations}
            className="h-9 text-xs font-bold rounded-xl gap-1.5 self-start md:self-auto"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-6">Organization</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Used (GB)</th>
                <th className="p-3.5">Quota (GB)</th>
                <th className="p-3.5">Utilization %</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-6 font-bold text-slate-900">{org.name}</td>
                    <td className="p-3.5">
                      <Badge className="bg-[#274690]/10 text-[#274690] border-0 text-[10px] font-bold">
                        {org.plan}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{org.usedGB} GB</td>
                    <td className="p-3.5 font-semibold text-slate-700">{org.quotaGB} GB</td>
                    <td className="p-3.5 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              org.isOver ? "bg-rose-500" : org.usagePercent >= 80 ? "bg-amber-500" : "bg-[#274690]"
                            }`}
                            style={{ width: `${Math.min(100, org.usagePercent)}%` }}
                          />
                        </div>
                        <span>{org.usagePercent}%</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          org.isOver
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : org.status === "Near Quota"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {org.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 px-2.5 text-xs font-bold text-[#274690] hover:bg-blue-50"
                      >
                        <Link href={`/super-admin/storage/organizations/${org.id}`}>
                          <Eye size={13} className="mr-1" /> View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {loading ? "Loading organizations storage data..." : "No organizations matching search criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
