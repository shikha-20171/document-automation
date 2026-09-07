"use client";

import crmApi, {
  type CrmClient,
  type CrmContact,
  type CrmDocument,
  type CrmRequest,
  type CrmNote,
  type CrmActivity,
  type CrmDashboardStats,
  type DuplicateCheckResult,
} from "@/services/crmApi";

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

// ─── Local Cache Helpers ──────────────────────────────────────────────────────
const KEYS = {
  clients: "crm_clients",
  contacts: "crm_contacts",
  documents: "crm_documents",
  requests: "crm_requests",
  activities: "crm_activities",
  notes: "crm_notes",
};

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {}
  return [];
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function now(): string {
  return new Date().toISOString();
}

function mapBackendClient(c: any): Client {
  return {
    id: String(c.id),
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
    createdAt: c.createdAt || now(),
    lastActivity: c.updatedAt || c.createdAt || now(),
    documents: Array.isArray(c.documents) ? c.documents.length : (c.documentsCount || 0),
  };
}

// ─── Client Store Facade ──────────────────────────────────────────────────────

export const clientStore = {
  // ─── DASHBOARD STATS ────────────────────────────────────────────────────────
  async fetchDashboardStats(): Promise<CrmDashboardStats | null> {
    try {
      const res = await crmApi.getDashboardStats();
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("CRM fetchDashboardStats error:", err);
    }
    return null;
  },

  // ─── DUPLICATE CHECK ────────────────────────────────────────────────────────
  async checkDuplicate(payload: { name?: string; email?: string; phone?: string; excludeId?: string }): Promise<DuplicateCheckResult> {
    try {
      const res = await crmApi.checkDuplicate(payload);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("CRM checkDuplicate error:", err);
    }
    return { isDuplicate: false };
  },

  // ─── CLIENTS ────────────────────────────────────────────────────────────────
  getClients(): Client[] {
    return load<Client>(KEYS.clients);
  },

  async fetchClients(params?: Record<string, any>): Promise<Client[]> {
    try {
      const res = await crmApi.getClients(params);
      if (res && res.success && Array.isArray(res.data)) {
        const backendClients = res.data.map(mapBackendClient);
        save(KEYS.clients, backendClients);
        return backendClients;
      }
    } catch (err) {
      console.warn("CRM fetchClients backend sync:", err);
    }
    return this.getClients();
  },

  async fetchClientById(id: string): Promise<Client | null> {
    try {
      const res = await crmApi.getClientById(id);
      if (res && res.success && res.data) {
        const client = mapBackendClient(res.data);
        const cached = this.getClients();
        const updated = [client, ...cached.filter(c => c.id !== client.id)];
        save(KEYS.clients, updated);
        return client;
      }
    } catch (err) {
      console.warn("CRM fetchClientById error:", err);
    }
    const found = this.getClients().find(c => c.id === id);
    return found || null;
  },

  async addClient(data: Omit<Client, "id" | "createdAt" | "lastActivity" | "documents">): Promise<Client> {
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

    const newClient = mapBackendClient(createdRecord);
    const clients = this.getClients();
    const updated = [newClient, ...clients.filter(c => c.id !== newClient.id)];
    save(KEYS.clients, updated);
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
    save(KEYS.clients, clients);
  },

  async archiveClient(id: string): Promise<void> {
    try {
      await crmApi.archiveClient(id);
    } catch (err) {
      console.error("CRM archiveClient API error:", err);
      throw err;
    }
    const clients = this.getClients().map(c => c.id === id ? { ...c, status: "Archived" as ClientStatus, lastActivity: now() } : c);
    save(KEYS.clients, clients);
  },

  async restoreClient(id: string): Promise<void> {
    try {
      await crmApi.restoreClient(id);
    } catch (err) {
      console.error("CRM restoreClient API error:", err);
      throw err;
    }
    const clients = this.getClients().map(c => c.id === id ? { ...c, status: "Active" as ClientStatus, lastActivity: now() } : c);
    save(KEYS.clients, clients);
  },

  async deleteClient(id: string): Promise<void> {
    try {
      await crmApi.deleteClient(id);
    } catch (err) {
      console.error("CRM deleteClient API error:", err);
      throw err;
    }
    save(KEYS.clients, this.getClients().filter(c => c.id !== id));
  },

  // ─── CONTACTS ───────────────────────────────────────────────────────────────
  getContacts(clientId?: string): Contact[] {
    const all = load<Contact>(KEYS.contacts);
    return clientId ? all.filter(c => c.clientId === clientId) : all;
  },

  async fetchContacts(clientId?: string): Promise<Contact[]> {
    try {
      const res = await crmApi.getContacts(clientId);
      if (res && res.success && Array.isArray(res.data)) {
        const backendContacts: Contact[] = res.data.map((c: any) => ({
          id: String(c.id),
          clientId: String(c.clientId),
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          designation: c.designation || "",
          email: c.email || "",
          phone: c.phone || "",
          department: c.department || "",
          role: c.role || "Contact",
          isPrimary: Boolean(c.isPrimary),
          notes: c.notes || "",
          status: (c.status as "Active" | "Inactive") || "Active",
        }));
        if (clientId) {
          const cachedOther = load<Contact>(KEYS.contacts).filter(c => c.clientId !== clientId);
          save(KEYS.contacts, [...backendContacts, ...cachedOther]);
        } else {
          save(KEYS.contacts, backendContacts);
        }
        return backendContacts;
      }
    } catch (err) {
      console.warn("CRM fetchContacts error:", err);
    }
    return this.getContacts(clientId);
  },

  async addContact(data: Omit<Contact, "id">): Promise<Contact> {
    let created: any = null;
    try {
      const res = await crmApi.addContact(data.clientId, data);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (err) {
      console.error("CRM addContact error:", err);
      throw err;
    }
    const newContact: Contact = {
      ...data,
      id: String(created?.id || Date.now()),
    };
    const all = load<Contact>(KEYS.contacts);
    save(KEYS.contacts, [newContact, ...all]);
    return newContact;
  },

  async updateContact(id: string, patch: Partial<Contact>): Promise<void> {
    try {
      await crmApi.updateContact(id, patch);
    } catch (err) {
      console.error("CRM updateContact error:", err);
      throw err;
    }
    const all = load<Contact>(KEYS.contacts).map(c => c.id === id ? { ...c, ...patch } : c);
    save(KEYS.contacts, all);
  },

  async deleteContact(id: string): Promise<void> {
    try {
      await crmApi.deleteContact(id);
    } catch (err) {
      console.error("CRM deleteContact error:", err);
      throw err;
    }
    save(KEYS.contacts, load<Contact>(KEYS.contacts).filter(c => c.id !== id));
  },

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────
  getDocuments(clientId?: string): ClientDocument[] {
    const all = load<ClientDocument>(KEYS.documents);
    return clientId ? all.filter(d => d.clientId === clientId) : all;
  },

  async fetchDocuments(clientId?: string): Promise<ClientDocument[]> {
    try {
      const res = await crmApi.getClientDocuments(clientId);
      if (res && res.success && Array.isArray(res.data)) {
        const backendDocs: ClientDocument[] = res.data.map((d: any) => ({
          id: String(d.id),
          clientId: String(d.clientId),
          title: d.title,
          type: (d.type as DocumentType) || "Contract",
          status: (d.status as DocumentStatus) || "Draft",
          owner: d.owner || "Organisation Admin",
          version: d.version || "1.0",
          createdAt: d.createdAt || now(),
          updatedAt: d.updatedAt || now(),
        }));
        if (clientId) {
          const cachedOther = load<ClientDocument>(KEYS.documents).filter(d => d.clientId !== clientId);
          save(KEYS.documents, [...backendDocs, ...cachedOther]);
        } else {
          save(KEYS.documents, backendDocs);
        }
        return backendDocs;
      }
    } catch (err) {
      console.warn("CRM fetchDocuments error:", err);
    }
    return this.getDocuments(clientId);
  },

  async addDocument(data: Omit<ClientDocument, "id" | "createdAt" | "updatedAt">): Promise<ClientDocument> {
    let created: any = null;
    try {
      const res = await crmApi.addClientDocument(data.clientId, data);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (err) {
      console.error("CRM addDocument error:", err);
      throw err;
    }
    const newDoc: ClientDocument = {
      ...data,
      id: String(created?.id || Date.now()),
      createdAt: created?.createdAt || now(),
      updatedAt: created?.updatedAt || now(),
    };
    const all = load<ClientDocument>(KEYS.documents);
    save(KEYS.documents, [newDoc, ...all]);
    return newDoc;
  },

  async updateDocument(id: string, patch: Partial<ClientDocument>): Promise<void> {
    try {
      await crmApi.updateClientDocument(id, patch);
    } catch (err) {
      console.error("CRM updateDocument error:", err);
      throw err;
    }
    const all = load<ClientDocument>(KEYS.documents).map(d => d.id === id ? { ...d, ...patch, updatedAt: now() } : d);
    save(KEYS.documents, all);
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await crmApi.deleteClientDocument(id);
    } catch (err) {
      console.error("CRM deleteDocument error:", err);
      throw err;
    }
    save(KEYS.documents, load<ClientDocument>(KEYS.documents).filter(d => d.id !== id));
  },

  // ─── REQUESTS ──────────────────────────────────────────────────────────────
  getRequests(clientId?: string): ClientRequest[] {
    const all = load<ClientRequest>(KEYS.requests);
    return clientId ? all.filter(r => r.clientId === clientId) : all;
  },

  async fetchRequests(clientId?: string): Promise<ClientRequest[]> {
    try {
      const res = await crmApi.getRequests(clientId);
      if (res && res.success && Array.isArray(res.data)) {
        const backendReqs: ClientRequest[] = res.data.map((r: any) => ({
          id: String(r.id),
          clientId: String(r.clientId),
          clientName: r.clientName || r.client?.name || "Client",
          title: r.title,
          type: (r.type as RequestType) || "New Document",
          description: r.description || "",
          priority: (r.priority as RequestPriority) || "Medium",
          status: (r.status as RequestStatus) || "New",
          assignedTo: r.assignedTo || "Unassigned",
          dueDate: r.dueDate || "",
          createdAt: r.createdAt || now(),
          requestedBy: r.requestedBy || "Admin",
          attachments: Array.isArray(r.attachments) ? r.attachments : [],
          comments: [],
        }));
        if (clientId) {
          const cachedOther = load<ClientRequest>(KEYS.requests).filter(r => r.clientId !== clientId);
          save(KEYS.requests, [...backendReqs, ...cachedOther]);
        } else {
          save(KEYS.requests, backendReqs);
        }
        return backendReqs;
      }
    } catch (err) {
      console.warn("CRM fetchRequests error:", err);
    }
    return this.getRequests(clientId);
  },

  async addRequest(data: Omit<ClientRequest, "id" | "createdAt" | "comments">): Promise<ClientRequest> {
    let created: any = null;
    try {
      const res = await crmApi.createRequest(data.clientId, data);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (err) {
      console.error("CRM addRequest error:", err);
      throw err;
    }
    const newReq: ClientRequest = {
      ...data,
      id: String(created?.id || Date.now()),
      createdAt: created?.createdAt || now(),
      comments: [],
    };
    const all = load<ClientRequest>(KEYS.requests);
    save(KEYS.requests, [newReq, ...all]);
    return newReq;
  },

  async updateRequest(id: string, patch: Partial<ClientRequest>): Promise<void> {
    try {
      await crmApi.updateRequest(id, patch);
    } catch (err) {
      console.error("CRM updateRequest error:", err);
      throw err;
    }
    const all = load<ClientRequest>(KEYS.requests).map(r => r.id === id ? { ...r, ...patch } : r);
    save(KEYS.requests, all);
  },

  addComment(requestId: string, text: string, author: string = "Admin"): void {
    const all = load<ClientRequest>(KEYS.requests).map(r => {
      if (r.id !== requestId) return r;
      const comment: RequestComment = { id: `C-${Date.now()}`, author, text, createdAt: now() };
      return { ...r, comments: [...(r.comments || []), comment] };
    });
    save(KEYS.requests, all);
  },

  async deleteRequest(id: string): Promise<void> {
    try {
      await crmApi.deleteRequest(id);
    } catch (err) {
      console.error("CRM deleteRequest error:", err);
      throw err;
    }
    save(KEYS.requests, load<ClientRequest>(KEYS.requests).filter(r => r.id !== id));
  },

  // ─── ACTIVITIES ────────────────────────────────────────────────────────────
  getActivities(clientId?: string): Activity[] {
    const all = load<Activity>(KEYS.activities);
    return clientId ? all.filter(a => a.clientId === clientId) : all;
  },

  async fetchActivities(clientId?: string): Promise<Activity[]> {
    try {
      const res = await crmApi.getActivities(clientId);
      if (res && res.success && Array.isArray(res.data)) {
        const backendActs: Activity[] = res.data.map((a: any) => ({
          id: String(a.id),
          clientId: String(a.clientId),
          type: (a.type as ActivityType) || "Client updated",
          description: a.description,
          user: a.user || "Admin",
          createdAt: a.createdAt || now(),
        }));
        if (clientId) {
          const cachedOther = load<Activity>(KEYS.activities).filter(a => a.clientId !== clientId);
          save(KEYS.activities, [...backendActs, ...cachedOther]);
        } else {
          save(KEYS.activities, backendActs);
        }
        return backendActs;
      }
    } catch (err) {
      console.warn("CRM fetchActivities error:", err);
    }
    return this.getActivities(clientId);
  },

  async addActivity(data: Omit<Activity, "id" | "createdAt">): Promise<Activity> {
    let created: any = null;
    try {
      const res = await crmApi.addActivity(data.clientId, data);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (err) {
      console.warn("CRM addActivity error:", err);
    }
    const newAct: Activity = {
      ...data,
      id: String(created?.id || Date.now()),
      createdAt: created?.createdAt || now(),
    };
    const all = load<Activity>(KEYS.activities);
    save(KEYS.activities, [newAct, ...all]);
    return newAct;
  },

  // ─── NOTES ─────────────────────────────────────────────────────────────────
  getNotes(clientId?: string): Note[] {
    const all = load<Note>(KEYS.notes);
    return clientId ? all.filter(n => n.clientId === clientId) : all;
  },

  async fetchNotes(clientId?: string): Promise<Note[]> {
    try {
      const res = await crmApi.getNotes(clientId);
      if (res && res.success && Array.isArray(res.data)) {
        const backendNotes: Note[] = res.data.map((n: any) => ({
          id: String(n.id),
          clientId: String(n.clientId),
          title: n.title,
          description: n.description || "",
          createdBy: n.createdBy || "Admin",
          createdAt: n.createdAt || now(),
          isPinned: Boolean(n.isPinned),
        }));
        if (clientId) {
          const cachedOther = load<Note>(KEYS.notes).filter(n => n.clientId !== clientId);
          save(KEYS.notes, [...backendNotes, ...cachedOther]);
        } else {
          save(KEYS.notes, backendNotes);
        }
        return backendNotes;
      }
    } catch (err) {
      console.warn("CRM fetchNotes error:", err);
    }
    return this.getNotes(clientId);
  },

  async addNote(data: Omit<Note, "id" | "createdAt">): Promise<Note> {
    let created: any = null;
    try {
      const res = await crmApi.createNote(data.clientId, data);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (err) {
      console.error("CRM addNote error:", err);
      throw err;
    }
    const newNote: Note = {
      ...data,
      id: String(created?.id || Date.now()),
      createdAt: created?.createdAt || now(),
    };
    const all = load<Note>(KEYS.notes);
    save(KEYS.notes, [newNote, ...all]);
    return newNote;
  },

  async updateNote(id: string, patch: Partial<Note>): Promise<void> {
    try {
      await crmApi.updateNote(id, patch);
    } catch (err) {
      console.error("CRM updateNote error:", err);
      throw err;
    }
    const all = load<Note>(KEYS.notes).map(n => n.id === id ? { ...n, ...patch } : n);
    save(KEYS.notes, all);
  },

  async deleteNote(id: string): Promise<void> {
    try {
      await crmApi.deleteNote(id);
    } catch (err) {
      console.error("CRM deleteNote error:", err);
      throw err;
    }
    save(KEYS.notes, load<Note>(KEYS.notes).filter(n => n.id !== id));
  },

  // ─── IMPORT ────────────────────────────────────────────────────────────────
  async importClients(records: Array<Record<string, any>>): Promise<any> {
    const res = await crmApi.importClients(records);
    if (res && res.success && res.data) {
      await this.fetchClients();
      return res.data;
    }
    throw new Error(res?.message || "Import failed");
  },

  // RESET
  reset(): void {
    Object.values(KEYS).forEach(k => {
      if (typeof window !== "undefined") localStorage.removeItem(k);
    });
  },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

export const INDUSTRIES = [
  "IT / Software", "Retail", "Consulting", "Construction",
  "Healthcare", "Finance", "Legal", "Education",
  "Manufacturing", "Real Estate", "Other",
];
export const DEPARTMENTS = [
  "Sales", "Legal", "Finance", "HR", "Operations",
  "Marketing", "Management", "Support",
];
export const TEAM_MEMBERS = [
  "Aman Verma", "Neha Jain", "Riya Sharma",
  "Priya Nair", "Vikram Singh", "Anjali Mehta",
];
export const COMPANY_SIZES = ["1", "2-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
export const ALL_TAGS = [
  "Enterprise", "VIP", "New", "High Value", "Renewal",
  "Legal", "Finance", "Compliance", "Priority",
];

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
