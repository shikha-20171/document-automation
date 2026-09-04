"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Upload,
  FileText,
  MoreHorizontal,
  Eye,
  Edit2,
  Download,
  Share2,
  CheckSquare,
  PenTool,
  Archive,
  CheckCircle2,
  X,
} from "lucide-react";
import { clientStore, type ClientDocument, formatDate } from "./clientStore";
import { CreateClientDocModal } from "./CreateClientDocModal";
import { UploadClientDocModal } from "./UploadClientDocModal";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Signed: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Archived: "bg-slate-100 text-slate-400 border-slate-200",
};

export default function ClientDocumentsTab() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => setDocs(clientStore.getDocuments(clientId));
  useEffect(() => {
    load();
  }, [clientId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = (doc: ClientDocument, status: ClientDocument["status"]) => {
    clientStore.updateDocument(doc.id, { status });
    load();
    showToast(`Document "${doc.title}" marked as ${status}`);
    setOpenMenu(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={15} className="text-[#ffd9a0]" /> {toast}
          <button onClick={() => setToast(null)}>
            <X size={13} className="opacity-60" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {docs.length} document{docs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Upload size={13} /> Upload
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition"
          >
            <Plus size={13} /> Create Document
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
            <tr>
              {[
                "Document",
                "Type",
                "Status",
                "Owner",
                "Version",
                "Created",
                "Updated",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-5 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr
                key={doc.id}
                className="border-t border-slate-100 hover:bg-slate-50/60 transition"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10">
                      <FileText size={14} className="text-[#274690]" />
                    </div>
                    <p className="font-bold text-slate-800 max-w-[160px] truncate">
                      {doc.title}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {doc.type}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      STATUS_STYLES[doc.status]
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 font-medium">{doc.owner}</td>
                <td className="px-5 py-4 font-mono text-slate-500">{doc.version}</td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                  {formatDate(doc.createdAt)}
                </td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                  {formatDate(doc.updatedAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === doc.id ? null : doc.id)
                      }
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {openMenu === doc.id && (
                      <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                        <DocMenuItem
                          icon={Eye}
                          label="View"
                          onClick={() => {
                            showToast(`Viewing "${doc.title}"`);
                            setOpenMenu(null);
                          }}
                        />
                        <DocMenuItem
                          icon={Edit2}
                          label="Edit"
                          onClick={() => {
                            showToast(`Editing "${doc.title}"`);
                            setOpenMenu(null);
                          }}
                        />
                        <DocMenuItem
                          icon={Download}
                          label="Download"
                          onClick={() => {
                            showToast(`Downloading "${doc.title}"`);
                            setOpenMenu(null);
                          }}
                        />
                        <DocMenuItem
                          icon={Share2}
                          label="Share"
                          onClick={() => {
                            showToast(`Sharing "${doc.title}"`);
                            setOpenMenu(null);
                          }}
                        />
                        {doc.status !== "Approved" && (
                          <DocMenuItem
                            icon={CheckSquare}
                            label="Request Approval"
                            onClick={() =>
                              updateStatus(doc, "Pending Approval")
                            }
                          />
                        )}
                        {doc.status !== "Signed" && (
                          <DocMenuItem
                            icon={PenTool}
                            label="Send for Signature"
                            onClick={() => updateStatus(doc, "Signed")}
                          />
                        )}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <DocMenuItem
                            icon={Archive}
                            label="Archive"
                            onClick={() => updateStatus(doc, "Archived")}
                            danger
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-300">
            <FileText size={32} className="mb-3" />
            <p className="text-sm font-semibold text-slate-500">
              No documents yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Create or upload your first document
            </p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateClientDocModal
          clientId={clientId}
          onClose={() => setShowCreate(false)}
          onSaved={(t) => {
            load();
            showToast(t);
            setShowCreate(false);
          }}
        />
      )}
      {showUpload && (
        <UploadClientDocModal
          clientId={clientId}
          onClose={() => setShowUpload(false)}
          onSaved={(t) => {
            load();
            showToast(t);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

function DocMenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 ${
        danger ? "text-red-600" : "text-slate-700"
      }`}
    >
      <Icon
        size={13}
        className={danger ? "text-red-400" : "text-slate-400"}
      />{" "}
      {label}
    </button>
  );
}
