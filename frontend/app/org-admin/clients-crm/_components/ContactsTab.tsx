"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Trash2, Star, User, Mail, Phone, MoreHorizontal, CheckCircle2, X } from "lucide-react";
import { clientStore, type Contact, DEPARTMENTS } from "./clientStore";

export default function ContactsTab() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => setContacts(clientStore.getContacts(clientId));
  useEffect(() => { load(); }, [clientId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = (c: Contact) => {
    clientStore.deleteContact(c.id);
    load();
    showToast(`${c.firstName} ${c.lastName} deleted`);
    setOpenMenu(null);
  };

  const handleSetPrimary = (c: Contact) => {
    contacts.forEach(ct => clientStore.updateContact(ct.id, { isPrimary: ct.id === c.id }));
    load();
    showToast(`${c.firstName} ${c.lastName} set as primary contact`);
    setOpenMenu(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={15} className="text-[#ffd9a0]" /> {toast}
          <button onClick={() => setToast(null)}><X size={13} className="opacity-60" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Contacts</h2>
          <p className="text-xs text-slate-500 mt-0.5">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition"
        >
          <Plus size={13} /> Add Contact
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
            <tr>
              {["Name", "Designation", "Email", "Phone", "Role", "Primary", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] text-xs font-black">
                      {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-slate-400">{c.department}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">{c.designation}</td>
                <td className="px-5 py-4 text-slate-500">
                  <a href={`mailto:${c.email}`} className="hover:text-[#274690] transition">{c.email}</a>
                </td>
                <td className="px-5 py-4 text-slate-500">{c.phone}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">{c.role}</span>
                </td>
                <td className="px-5 py-4">
                  {c.isPrimary ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <Star size={11} fill="currentColor" /> Primary
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition">
                      <MoreHorizontal size={15} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                        <MenuItem icon={Edit2} label="Edit" onClick={() => { setEditing(c); setShowModal(true); setOpenMenu(null); }} />
                        {!c.isPrimary && <MenuItem icon={Star} label="Set Primary" onClick={() => handleSetPrimary(c)} />}
                        <MenuItem icon={Mail} label="Email" onClick={() => { window.open(`mailto:${c.email}`); setOpenMenu(null); }} />
                        <MenuItem icon={Trash2} label="Delete" onClick={() => handleDelete(c)} danger />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-300">
            <User size={32} className="mb-3" />
            <p className="text-sm font-semibold text-slate-500">No contacts yet</p>
            <p className="text-xs text-slate-400 mt-1">Add a contact to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <ContactModal
          clientId={clientId}
          contact={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={msg => { load(); showToast(msg); setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition ${danger ? "text-red-600" : "text-slate-700"}`}>
      <Icon size={13} className={danger ? "text-red-400" : "text-slate-400"} /> {label}
    </button>
  );
}

function ContactModal({ clientId, contact, onClose, onSaved }: {
  clientId: string; contact: Contact | null; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    designation: contact?.designation ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    department: contact?.department ?? "",
    role: contact?.role ?? "Contact",
    isPrimary: contact?.isPrimary ?? false,
    notes: contact?.notes ?? "",
    status: (contact?.status ?? "Active") as Contact["status"],
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (contact) {
      clientStore.updateContact(contact.id, { ...form, clientId });
      onSaved(`${form.firstName} ${form.lastName} updated`);
    } else {
      clientStore.addContact({ ...form, clientId });
      onSaved(`${form.firstName} ${form.lastName} added`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">{contact ? "Edit Contact" : "Add Contact"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" value={form.firstName} onChange={v => set("firstName", v)} />
            <Field label="Last Name *" value={form.lastName} onChange={v => set("lastName", v)} />
            <Field label="Designation" value={form.designation} onChange={v => set("designation", v)} />
            <Field label="Email" value={form.email} onChange={v => set("email", v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={v => set("phone", v)} />
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Department</label>
              <select value={form.department} onChange={e => set("department", e.target.value)} className={INPUT_CLS}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <Field label="Role" value={form.role} onChange={v => set("role", v)} />
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={INPUT_CLS}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPrimary} onChange={e => set("isPrimary", e.target.checked)} className="rounded" />
            <span className="text-xs font-semibold text-slate-700">Set as Primary Contact</span>
          </label>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className={`${INPUT_CLS} resize-none h-auto py-2`} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
          <button onClick={handleSave} disabled={!form.firstName.trim() || !form.lastName.trim()} className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-40">
            {contact ? "Save Changes" : "Add Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white transition";

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={INPUT_CLS} />
    </div>
  );
}
