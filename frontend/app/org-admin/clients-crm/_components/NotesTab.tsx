"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, StickyNote, Pin, Edit2, Trash2, Search, CheckCircle2, X, Lock } from "lucide-react";
import { clientStore, type Note, formatDate } from "./clientStore";

export default function NotesTab() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    const all = clientStore.getNotes(clientId);
    // Pinned first
    setNotes([...all.filter(n => n.isPinned), ...all.filter(n => !n.isPinned)]);
  };
  useEffect(() => { load(); }, [clientId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = (note: Note) => {
    clientStore.deleteNote(note.id);
    load();
    showToast("Note deleted");
  };

  const handlePin = (note: Note) => {
    clientStore.updateNote(note.id, { isPinned: !note.isPinned });
    load();
    showToast(note.isPinned ? "Note unpinned" : "Note pinned");
  };

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Notes</h2>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} note{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
            <Lock size={9} /> Internal only
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="h-8 w-48 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-[#274690]" />
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition">
            <Plus size={13} /> Add Note
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-300">
            <StickyNote size={32} className="mb-3" />
            <p className="text-sm font-semibold text-slate-500">No notes yet</p>
            <p className="text-xs text-slate-400 mt-1">Add internal notes about this client</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map(note => (
              <div key={note.id} className={`rounded-2xl border p-4 transition hover:shadow-md ${note.isPinned ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"}`}>
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {note.isPinned && <Pin size={11} className="text-amber-500 shrink-0 fill-current" />}
                    <h3 className="text-xs font-black text-slate-800 truncate">{note.title}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handlePin(note)} title={note.isPinned ? "Unpin" : "Pin"} className={`rounded-lg p-1 transition ${note.isPinned ? "text-amber-500 bg-amber-100" : "text-slate-400 hover:bg-slate-100"}`}>
                      <Pin size={12} />
                    </button>
                    <button onClick={() => { setEditing(note); setShowModal(true); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(note)} className="rounded-lg p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{note.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400">{note.createdBy}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(note.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NoteModal
          clientId={clientId}
          note={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={msg => { load(); showToast(msg); setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function NoteModal({ clientId, note, onClose, onSaved }: {
  clientId: string; note: Note | null; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    title: note?.title ?? "",
    description: note?.description ?? "",
    isPinned: note?.isPinned ?? false,
    createdBy: note?.createdBy ?? "You",
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (note) {
      clientStore.updateNote(note.id, form);
      onSaved("Note updated");
    } else {
      clientStore.addNote({ ...form, clientId });
      onSaved("Note added");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">{note ? "Edit Note" : "Add Note"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} className={INPUT_CLS} placeholder="Note title" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className={`${INPUT_CLS} h-auto py-2 resize-none`} placeholder="Write your note here..." />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Created By</label>
            <input value={form.createdBy} onChange={e => set("createdBy", e.target.value)} className={INPUT_CLS} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => set("isPinned", e.target.checked)} className="rounded" />
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Pin size={11} /> Pin this note
            </span>
          </label>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
            <Lock size={12} className="text-amber-600" />
            <p className="text-[10px] font-semibold text-amber-700">This note is internal — not visible to the client</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
          <button onClick={handleSave} disabled={!form.title.trim()} className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-40">
            {note ? "Save Changes" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white transition";
