"use client";

import ClientRequestsTab from "../_components/ClientRequestsTab";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AllRequestsPage() {
  const router = useRouter();
  return (
    <div className="space-y-5 pb-8">
      <button onClick={() => router.push("/org-admin/clients-crm")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#274690] transition">
        <ArrowLeft size={14} /> Clients & CRM
      </button>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-lg bg-[#274690] px-2.5 py-0.5 text-[10px] font-black text-white tracking-wide">CRM Module</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Requests</h1>
        <p className="text-xs text-slate-500 mt-1">All client requests across your organisation</p>
      </div>
      <ClientRequestsTab allClients />
    </div>
  );
}
