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

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_CLIENTS: Client[] = [
  {
    id: "CL-00021",
    name: "ABC Technologies Pvt. Ltd.",
    type: "Company",
    contactPerson: "Rahul Sharma",
    email: "rahul@abctech.in",
    phone: "+91 98765 43210",
    website: "https://abctech.in",
    address: "Tower 3, Cyber Hub",
    city: "Gurugram",
    state: "Haryana",
    country: "India",
    postalCode: "122002",
    industry: "IT / Software",
    companySize: "201-500",
    status: "Active",
    department: "Sales",
    assignedTo: "Aman Verma",
    tags: ["VIP", "Enterprise", "High Value"],
    notes: "Client prefers all contracts to be reviewed by legal before sending.",
    createdAt: "2026-01-15T09:30:00Z",
    lastActivity: "2026-08-12T08:30:00Z",
    documents: 36,
  },
  {
    id: "CL-00022",
    name: "GreenField Retail",
    type: "Company",
    contactPerson: "Karan Mehta",
    email: "karan@greenfield.in",
    phone: "+91 87654 32109",
    website: "https://greenfield.in",
    address: "23 MG Road",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    postalCode: "411001",
    industry: "Retail",
    companySize: "51-200",
    status: "Active",
    department: "Legal",
    assignedTo: "Neha Jain",
    tags: ["New", "Renewal"],
    notes: "",
    createdAt: "2026-03-20T11:00:00Z",
    lastActivity: "2026-08-11T14:00:00Z",
    documents: 18,
  },
  {
    id: "CL-00023",
    name: "BluePeak Advisors",
    type: "Company",
    contactPerson: "Aditi Shah",
    email: "aditi@bluepeak.in",
    phone: "+91 76543 21098",
    website: "https://bluepeak.in",
    address: "Wing B, Ahmedabad One",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380059",
    industry: "Consulting",
    companySize: "11-50",
    status: "Prospect",
    department: "Sales",
    assignedTo: "Riya Sharma",
    tags: ["Finance"],
    notes: "",
    createdAt: "2026-05-10T09:00:00Z",
    lastActivity: "2026-08-09T10:00:00Z",
    documents: 12,
  },
  {
    id: "CL-00024",
    name: "Vantage Buildworks",
    type: "Company",
    contactPerson: "Rahul Sethi",
    email: "rahul@vantage.in",
    phone: "+91 65432 10987",
    website: "https://vantage.in",
    address: "Plot 17, MIDC",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    postalCode: "440001",
    industry: "Construction",
    companySize: "51-200",
    status: "Archived",
    department: "Finance",
    assignedTo: "Aman Verma",
    tags: ["Legal"],
    notes: "",
    createdAt: "2025-07-01T10:00:00Z",
    lastActivity: "2026-07-24T12:00:00Z",
    documents: 8,
  },
  {
    id: "CL-00025",
    name: "Prism Healthcare",
    type: "Company",
    contactPerson: "Sunita Rao",
    email: "sunita@prismhealth.in",
    phone: "+91 54321 09876",
    website: "https://prismhealth.in",
    address: "112 Necklace Road",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    postalCode: "500001",
    industry: "Healthcare",
    companySize: "201-500",
    status: "Active",
    department: "Legal",
    assignedTo: "Priya Nair",
    tags: ["VIP", "High Value"],
    notes: "Requires HIPAA-compliant document handling.",
    createdAt: "2026-02-08T08:00:00Z",
    lastActivity: "2026-08-10T09:30:00Z",
    documents: 24,
  },
  {
    id: "CL-00026",
    name: "Meera Kapoor",
    type: "Individual",
    contactPerson: "Meera Kapoor",
    email: "meera@meerakapoor.in",
    phone: "+91 43210 98765",
    website: "",
    address: "45 Pali Hill",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400050",
    industry: "Legal",
    companySize: "1",
    status: "Inactive",
    department: "Sales",
    assignedTo: "Riya Sharma",
    tags: ["Legal"],
    notes: "",
    createdAt: "2025-11-14T14:00:00Z",
    lastActivity: "2026-06-01T11:00:00Z",
    documents: 5,
  },
];

const SAMPLE_CONTACTS: Contact[] = [
  { id: "CT-001", clientId: "CL-00021", firstName: "Rahul", lastName: "Sharma", designation: "HR Manager", email: "rahul@abctech.in", phone: "+91 98765 43210", department: "HR", role: "Primary", isPrimary: true, notes: "", status: "Active" },
  { id: "CT-002", clientId: "CL-00021", firstName: "Priya", lastName: "Singh", designation: "Legal Manager", email: "priya@abctech.in", phone: "+91 98765 43211", department: "Legal", role: "Legal Contact", isPrimary: false, notes: "", status: "Active" },
  { id: "CT-003", clientId: "CL-00021", firstName: "Amit", lastName: "Kumar", designation: "Finance Manager", email: "amit@abctech.in", phone: "+91 98765 43212", department: "Finance", role: "Finance Contact", isPrimary: false, notes: "", status: "Active" },
  { id: "CT-004", clientId: "CL-00022", firstName: "Karan", lastName: "Mehta", designation: "CEO", email: "karan@greenfield.in", phone: "+91 87654 32109", department: "Executive", role: "Primary", isPrimary: true, notes: "", status: "Active" },
  { id: "CT-005", clientId: "CL-00023", firstName: "Aditi", lastName: "Shah", designation: "Managing Director", email: "aditi@bluepeak.in", phone: "+91 76543 21098", department: "Executive", role: "Primary", isPrimary: true, notes: "", status: "Active" },
  { id: "CT-006", clientId: "CL-00025", firstName: "Sunita", lastName: "Rao", designation: "Director", email: "sunita@prismhealth.in", phone: "+91 54321 09876", department: "Management", role: "Primary", isPrimary: true, notes: "", status: "Active" },
];

const SAMPLE_DOCUMENTS: ClientDocument[] = [
  { id: "DOC-001", clientId: "CL-00021", title: "NDA Agreement 2026", type: "NDA", status: "Signed", owner: "Rahul Sharma", version: "v2.1", createdAt: "2026-01-20T10:00:00Z", updatedAt: "2026-02-10T14:00:00Z" },
  { id: "DOC-002", clientId: "CL-00021", title: "Service Agreement Q1", type: "Contract", status: "Approved", owner: "Aman Verma", version: "v1.0", createdAt: "2026-02-01T09:00:00Z", updatedAt: "2026-02-15T11:00:00Z" },
  { id: "DOC-003", clientId: "CL-00021", title: "Invoice Agreement Jul 2026", type: "Invoice", status: "Pending Approval", owner: "Amit Kumar", version: "v1.0", createdAt: "2026-07-01T08:30:00Z", updatedAt: "2026-08-01T08:30:00Z" },
  { id: "DOC-004", clientId: "CL-00021", title: "Employment Contract Draft", type: "Contract", status: "Draft", owner: "Priya Singh", version: "v0.1", createdAt: "2026-08-01T10:00:00Z", updatedAt: "2026-08-10T10:00:00Z" },
  { id: "DOC-005", clientId: "CL-00022", title: "Retail Partnership NDA", type: "NDA", status: "Approved", owner: "Neha Jain", version: "v1.0", createdAt: "2026-04-01T09:00:00Z", updatedAt: "2026-04-20T11:00:00Z" },
  { id: "DOC-006", clientId: "CL-00025", title: "Healthcare Compliance Doc", type: "Compliance", status: "Pending Approval", owner: "Priya Nair", version: "v1.2", createdAt: "2026-07-15T10:00:00Z", updatedAt: "2026-08-08T09:00:00Z" },
];

const SAMPLE_REQUESTS: ClientRequest[] = [
  {
    id: "REQ-001", clientId: "CL-00021", clientName: "ABC Technologies Pvt. Ltd.",
    title: "NDA Agreement Request", type: "NDA", description: "Client requires a non-disclosure agreement before sharing sensitive project data.",
    priority: "High", status: "In Progress", assignedTo: "Priya Singh", dueDate: "2026-08-15",
    createdAt: "2026-08-01T09:00:00Z", requestedBy: "Rahul Sharma", attachments: [],
    comments: [
      { id: "C-001", author: "Aman Verma", text: "Template selected, drafting in progress.", createdAt: "2026-08-02T10:00:00Z" },
    ],
  },
  {
    id: "REQ-002", clientId: "CL-00021", clientName: "ABC Technologies Pvt. Ltd.",
    title: "Q3 Service Agreement Renewal", type: "Contract", description: "Renew the service agreement for Q3 2026.",
    priority: "Medium", status: "Pending Approval", assignedTo: "Aman Verma", dueDate: "2026-08-20",
    createdAt: "2026-08-05T11:00:00Z", requestedBy: "Amit Kumar", attachments: [],
    comments: [],
  },
  {
    id: "REQ-003", clientId: "CL-00022", clientName: "GreenField Retail",
    title: "Partnership Compliance Review", type: "Compliance Document", description: "Legal compliance review for new retail partnership.",
    priority: "Low", status: "New", assignedTo: "Neha Jain", dueDate: "2026-08-30",
    createdAt: "2026-08-10T08:00:00Z", requestedBy: "Karan Mehta", attachments: [],
    comments: [],
  },
  {
    id: "REQ-004", clientId: "CL-00025", clientName: "Prism Healthcare",
    title: "HIPAA Compliance Document", type: "Compliance Document", description: "Prepare HIPAA-compliant data processing agreement.",
    priority: "Urgent", status: "Waiting for Client", assignedTo: "Priya Nair", dueDate: "2026-08-12",
    createdAt: "2026-08-08T07:00:00Z", requestedBy: "Sunita Rao", attachments: [],
    comments: [
      { id: "C-002", author: "Priya Nair", text: "Waiting for client to provide their DPA template.", createdAt: "2026-08-09T09:00:00Z" },
    ],
  },
];

const SAMPLE_ACTIVITIES: Activity[] = [
  { id: "ACT-001", clientId: "CL-00021", type: "Client created", description: "Client ABC Technologies was created", user: "Aman Verma", createdAt: "2026-01-15T09:30:00Z" },
  { id: "ACT-002", clientId: "CL-00021", type: "Contact added", description: "Priya Singh added as Legal Contact", user: "Aman Verma", createdAt: "2026-01-15T10:00:00Z" },
  { id: "ACT-003", clientId: "CL-00021", type: "Document created", description: "NDA Agreement 2026 created", user: "Priya Singh", createdAt: "2026-01-20T10:00:00Z" },
  { id: "ACT-004", clientId: "CL-00021", type: "Document shared", description: "NDA sent to client for review", user: "Aman Verma", createdAt: "2026-02-01T11:00:00Z" },
  { id: "ACT-005", clientId: "CL-00021", type: "Document approved", description: "NDA Agreement approved by HR Manager", user: "Rahul Sharma", createdAt: "2026-02-08T14:00:00Z" },
  { id: "ACT-006", clientId: "CL-00021", type: "Signature requested", description: "E-signature requested on NDA Agreement", user: "Aman Verma", createdAt: "2026-02-09T09:30:00Z" },
  { id: "ACT-007", clientId: "CL-00021", type: "Signature completed", description: "Client signed the NDA Agreement", user: "Rahul Sharma", createdAt: "2026-02-10T14:00:00Z" },
  { id: "ACT-008", clientId: "CL-00021", type: "Request created", description: "NDA Agreement Request created with High priority", user: "Rahul Sharma", createdAt: "2026-08-01T09:00:00Z" },
  { id: "ACT-009", clientId: "CL-00021", type: "Note added", description: "Internal note added: Legal review required", user: "Priya Singh", createdAt: "2026-08-05T10:30:00Z" },
  { id: "ACT-010", clientId: "CL-00021", type: "User assigned", description: "Priya Singh assigned to NDA Request", user: "Aman Verma", createdAt: "2026-08-01T09:05:00Z" },
  { id: "ACT-011", clientId: "CL-00022", type: "Client created", description: "Client GreenField Retail was created", user: "Neha Jain", createdAt: "2026-03-20T11:00:00Z" },
  { id: "ACT-012", clientId: "CL-00025", type: "Client created", description: "Client Prism Healthcare was created", user: "Priya Nair", createdAt: "2026-02-08T08:00:00Z" },
];

const SAMPLE_NOTES: Note[] = [
  { id: "NOTE-001", clientId: "CL-00021", title: "Legal Review Requirement", description: "Client prefers all contracts to be reviewed by legal before sending. Ensure Priya Singh reviews all outgoing agreements.", createdBy: "Aman Verma", createdAt: "2026-01-20T10:00:00Z", isPinned: true },
  { id: "NOTE-002", clientId: "CL-00021", title: "Communication Preference", description: "Rahul Sharma prefers email communication. WhatsApp only for urgent matters. Do not call on weekends.", createdBy: "Priya Singh", createdAt: "2026-02-01T09:00:00Z", isPinned: false },
  { id: "NOTE-003", clientId: "CL-00021", title: "Q3 Contract Renewal Notes", description: "Client is interested in upgrading the service package for Q3. Schedule a call with the finance team to discuss pricing.", createdBy: "Aman Verma", createdAt: "2026-07-15T11:00:00Z", isPinned: false },
  { id: "NOTE-004", clientId: "CL-00025", title: "HIPAA Requirements", description: "All documents must be HIPAA compliant. Client has a strict data retention policy — no data beyond 7 years.", createdBy: "Priya Nair", createdAt: "2026-02-10T09:00:00Z", isPinned: true },
];

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

// ─── Store API ────────────────────────────────────────────────────────────────

export const clientStore = {
  // CLIENTS
  getClients(): Client[] {
    return load<Client>(KEYS.clients, SAMPLE_CLIENTS);
  },
  saveClients(clients: Client[]): void {
    save(KEYS.clients, clients);
  },
  addClient(data: Omit<Client, "id" | "createdAt" | "lastActivity" | "documents">): Client {
    const clients = this.getClients();
    const clientId = `CL-${String(10000 + clients.length + 1).slice(-5)}`;
    const newClient: Client = { ...data, id: clientId, createdAt: now(), lastActivity: now(), documents: 0 };
    const updated = [newClient, ...clients];
    this.saveClients(updated);
    this.addActivity({ clientId: clientId, type: "Client created", description: `Client ${data.name} was created`, user: "You" });
    return newClient;
  },
  updateClient(id: string, patch: Partial<Client>): void {
    const clients = this.getClients().map(c => c.id === id ? { ...c, ...patch, lastActivity: now() } : c);
    this.saveClients(clients);
    this.addActivity({ clientId: id, type: "Client updated", description: "Client information updated", user: "You" });
  },
  deleteClient(id: string): void {
    this.saveClients(this.getClients().filter(c => c.id !== id));
  },

  // CONTACTS
  getContacts(clientId?: string): Contact[] {
    const all = load<Contact>(KEYS.contacts, SAMPLE_CONTACTS);
    return clientId ? all.filter(c => c.clientId === clientId) : all;
  },
  addContact(data: Omit<Contact, "id">): Contact {
    const all = load<Contact>(KEYS.contacts, SAMPLE_CONTACTS);
    const newContact: Contact = { ...data, id: genId("CT") };
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
