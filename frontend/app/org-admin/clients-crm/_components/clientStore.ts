"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientStatus = "Active" | "Inactive" | "Prospect" | "Archived";
export type ClientType = "Company" | "Individual";

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  industry: string;
  companySize: string;
  status: ClientStatus;
  department: string;
  assignedTo: string;
  tags: string[];
  notes: string;
  createdAt: string;
  lastActivity: string;
  documents: number;
}

export interface Contact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  designation: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  isPrimary: boolean;
  notes: string;
  status: "Active" | "Inactive";
}

export type DocumentStatus = "Draft" | "Pending Approval" | "Approved" | "Signed" | "Rejected" | "Archived";
export type DocumentType = "Contract" | "NDA" | "Agreement" | "Invoice" | "Legal" | "Finance" | "HR" | "Compliance" | "Other";

export interface ClientDocument {
  id: string;
  clientId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  owner: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = "New" | "In Progress" | "Waiting for Client" | "Pending Approval" | "Completed" | "Rejected" | "Cancelled";
export type RequestPriority = "Low" | "Medium" | "High" | "Urgent";
export type RequestType = "New Document" | "Document Update" | "Contract" | "NDA" | "Agreement" | "Compliance Document" | "Signature Request" | "Other";

export interface ClientRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  type: RequestType;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  requestedBy: string;
  attachments: string[];
  comments: RequestComment[];
}

export interface RequestComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type ActivityType =
  | "Client created" | "Client updated" | "Contact added"
  | "Document created" | "Document shared" | "Document approved"
  | "Signature requested" | "Signature completed"
  | "Request created" | "Request completed"
  | "Note added" | "User assigned";

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  description: string;
  user: string;
  createdAt: string;
}

export interface Note {
  id: string;
  clientId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isPinned: boolean;
}

// ─── Initial Empty Stores ──────────────────────────────────────────────────
const SAMPLE_CLIENTS: Client[] = [];
const SAMPLE_CONTACTS: Contact[] = [];
const SAMPLE_DOCUMENTS: ClientDocument[] = [];
const SAMPLE_REQUESTS: ClientRequest[] = [];
const SAMPLE_ACTIVITIES: Activity[] = [];
const SAMPLE_NOTES: Note[] = [];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  clients: "crm_clients",
  contacts: "crm_contacts",
  documents: "crm_documents",
  requests: "crm_requests",
  activities: "crm_activities",
  notes: "crm_notes",
};

// ─── Store Helpers ────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {}
  return fallback;
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function now(): string {
  return new Date().toISOString();
}

import crmApi, { type CrmClient } from "@/services/crmApi";

// ─── Store API ────────────────────────────────────────────────────────────────

export const clientStore = {
  // CLIENTS
  getClients(): Client[] {
    return load<Client>(KEYS.clients, SAMPLE_CLIENTS);
  },
  async fetchClients(): Promise<Client[]> {
    try {
      const res = await crmApi.getClients();
      if (res && res.success && Array.isArray(res.data)) {
        const backendClients: Client[] = res.data.map((c: any) => ({
          id: c.id,
          name: c.name || "Unnamed Client",
          type: (c.type as ClientType) || "Company",
          contactPerson: c.contactPerson || "",
          email: c.email || "",
          phone: c.phone || "",
          website: c.website || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          country: c.country || "India",
          postalCode: c.postalCode || "",
          industry: c.industry || "Other",
          companySize: c.companySize || "2-10",
          status: (c.status as ClientStatus) || "Active",
          department: c.department || "General",
          assignedTo: c.assignedTo || "Account Manager",
          tags: Array.isArray(c.tags) ? c.tags : [],
          notes: c.notes || "",
          createdAt: c.createdAt || new Date().toISOString(),
          lastActivity: c.updatedAt || c.createdAt || new Date().toISOString(),
          documents: Array.isArray(c.documents) ? c.documents.length : (c.documentsCount || 0),
        }));
        save(KEYS.clients, backendClients);
        return backendClients;
      }
    } catch (err) {
      console.warn("CRM fetchClients backend sync:", err);
    }
    return this.getClients();
  },
  saveClients(clients: Client[]): void {
    save(KEYS.clients, clients);
  },
  async addClient(data: Omit<Client, "id" | "createdAt" | "lastActivity" | "documents">): Promise<Client> {
    const clients = this.getClients();
    let createdRecord: any = null;
    try {
      const res = await crmApi.createClient(data as any);
      if (res && res.success && res.data) {
        createdRecord = res.data;
      }
    } catch (err) {
      console.error("CRM addClient API error:", err);
      throw err;
    }

    const clientId = createdRecord?.id || `CL-${String(10000 + clients.length + 1).slice(-5)}`;
    const newClient: Client = {
      ...data,
      id: clientId,
      createdAt: createdRecord?.createdAt || now(),
      lastActivity: createdRecord?.updatedAt || now(),
      documents: 0,
    };
    const updated = [newClient, ...clients.filter(c => c.id !== clientId)];
    this.saveClients(updated);
    this.addActivity({ clientId: clientId, type: "Client created", description: `Client ${data.name} was created`, user: "You" });
    return newClient;
  },
  async updateClient(id: string, patch: Partial<Client>): Promise<void> {
    try {
      await crmApi.updateClient(id, patch as any);
    } catch (err) {
      console.error("CRM updateClient API error:", err);
      throw err;
    }
    const clients = this.getClients().map(c => c.id === id ? { ...c, ...patch, lastActivity: now() } : c);
    this.saveClients(clients);
    this.addActivity({ clientId: id, type: "Client updated", description: "Client information updated", user: "You" });
  },
  async deleteClient(id: string): Promise<void> {
    try {
      await crmApi.deleteClient(id);
    } catch (err) {
      console.error("CRM deleteClient API error:", err);
      throw err;
    }
    this.saveClients(this.getClients().filter(c => c.id !== id));
  },

  // CONTACTS
  getContacts(clientId?: string): Contact[] {
    const all = load<Contact>(KEYS.contacts, SAMPLE_CONTACTS);
    return clientId ? all.filter(c => c.clientId === clientId) : all;
  },
  async addContact(data: Omit<Contact, "id">): Promise<Contact> {
    const all = load<Contact>(KEYS.contacts, SAMPLE_CONTACTS);
    let createdId: string | null = null;
    try {
      const res = await crmApi.addContact(data.clientId, data);
      if (res && res.success && (res.data as any)?.id) {
        createdId = (res.data as any).id;
      }
    } catch (err) {
      console.warn("CRM addContact API fallback:", err);
    }
    const newContact: Contact = { ...data, id: createdId || genId("CT") };
    save(KEYS.contacts, [newContact, ...all]);
    this.addActivity({ clientId: data.clientId, type: "Contact added", description: `${data.firstName} ${data.lastName} added as ${data.role}`, user: "You" });
    return newContact;
  },
  updateContact(id: string, patch: Partial<Contact>): void {
    const all = load<Contact>(KEYS.contacts, SAMPLE_CONTACTS).map(c => c.id === id ? { ...c, ...patch } : c);
    save(KEYS.contacts, all);
  },
  deleteContact(id: string): void {
    save(KEYS.contacts, load<Contact>(KEYS.contacts, SAMPLE_CONTACTS).filter(c => c.id !== id));
  },

  // DOCUMENTS
  getDocuments(clientId?: string): ClientDocument[] {
    const all = load<ClientDocument>(KEYS.documents, SAMPLE_DOCUMENTS);
    return clientId ? all.filter(d => d.clientId === clientId) : all;
  },
  addDocument(data: Omit<ClientDocument, "id" | "createdAt" | "updatedAt">): ClientDocument {
    const all = load<ClientDocument>(KEYS.documents, SAMPLE_DOCUMENTS);
    const newDoc: ClientDocument = { ...data, id: genId("DOC"), createdAt: now(), updatedAt: now() };
    save(KEYS.documents, [newDoc, ...all]);
    this.addActivity({ clientId: data.clientId, type: "Document created", description: `Document "${data.title}" created`, user: "You" });
    return newDoc;
  },
  updateDocument(id: string, patch: Partial<ClientDocument>): void {
    const all = load<ClientDocument>(KEYS.documents, SAMPLE_DOCUMENTS).map(d => d.id === id ? { ...d, ...patch, updatedAt: now() } : d);
    save(KEYS.documents, all);
  },

  // REQUESTS
  getRequests(clientId?: string): ClientRequest[] {
    const all = load<ClientRequest>(KEYS.requests, SAMPLE_REQUESTS);
    return clientId ? all.filter(r => r.clientId === clientId) : all;
  },
  addRequest(data: Omit<ClientRequest, "id" | "createdAt" | "comments">): ClientRequest {
    const all = load<ClientRequest>(KEYS.requests, SAMPLE_REQUESTS);
    const newReq: ClientRequest = { ...data, id: genId("REQ"), createdAt: now(), comments: [] };
    save(KEYS.requests, [newReq, ...all]);
    this.addActivity({ clientId: data.clientId, type: "Request created", description: `Request "${data.title}" created with ${data.priority} priority`, user: "You" });
    return newReq;
  },
  updateRequest(id: string, patch: Partial<ClientRequest>): void {
    const all = load<ClientRequest>(KEYS.requests, SAMPLE_REQUESTS).map(r => r.id === id ? { ...r, ...patch } : r);
    save(KEYS.requests, all);
  },
  addComment(requestId: string, text: string, author: string = "You"): void {
    const all = load<ClientRequest>(KEYS.requests, SAMPLE_REQUESTS).map(r => {
      if (r.id !== requestId) return r;
      const comment: RequestComment = { id: genId("C"), author, text, createdAt: now() };
      return { ...r, comments: [...r.comments, comment] };
    });
    save(KEYS.requests, all);
  },

  // ACTIVITIES
  getActivities(clientId?: string): Activity[] {
    const all = load<Activity>(KEYS.activities, SAMPLE_ACTIVITIES);
    return clientId ? all.filter(a => a.clientId === clientId) : all;
  },
  addActivity(data: Omit<Activity, "id" | "createdAt">): Activity {
    const all = load<Activity>(KEYS.activities, SAMPLE_ACTIVITIES);
    const newAct: Activity = { ...data, id: genId("ACT"), createdAt: now() };
    save(KEYS.activities, [newAct, ...all]);
    return newAct;
  },

  // NOTES
  getNotes(clientId?: string): Note[] {
    const all = load<Note>(KEYS.notes, SAMPLE_NOTES);
    return clientId ? all.filter(n => n.clientId === clientId) : all;
  },
  addNote(data: Omit<Note, "id" | "createdAt">): Note {
    const all = load<Note>(KEYS.notes, SAMPLE_NOTES);
    const newNote: Note = { ...data, id: genId("NOTE"), createdAt: now() };
    save(KEYS.notes, [newNote, ...all]);
    this.addActivity({ clientId: data.clientId, type: "Note added", description: `Note "${data.title}" added`, user: "You" });
    return newNote;
  },
  updateNote(id: string, patch: Partial<Note>): void {
    const all = load<Note>(KEYS.notes, SAMPLE_NOTES).map(n => n.id === id ? { ...n, ...patch } : n);
    save(KEYS.notes, all);
  },
  deleteNote(id: string): void {
    save(KEYS.notes, load<Note>(KEYS.notes, SAMPLE_NOTES).filter(n => n.id !== id));
  },

  // RESET (for development)
  reset(): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

export const INDUSTRIES = ["IT / Software", "Retail", "Consulting", "Construction", "Healthcare", "Finance", "Legal", "Education", "Manufacturing", "Real Estate", "Other"];
export const DEPARTMENTS = ["Sales", "Legal", "Finance", "HR", "Operations", "Marketing", "Management", "Support"];
export const TEAM_MEMBERS = ["Aman Verma", "Neha Jain", "Riya Sharma", "Priya Nair", "Vikram Singh", "Anjali Mehta"];
export const COMPANY_SIZES = ["1", "2-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
export const ALL_TAGS = ["Enterprise", "VIP", "New", "High Value", "Renewal", "Legal", "Finance", "Compliance", "Priority"];

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
