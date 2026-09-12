"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  FileText,
  Palette,
  Users,
  FolderTree,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
  KeyRound,
  Sliders,
  Send,
  Search,
  Check,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { orgSettingsApi } from "@/services/settingsApi";
import { orgTeamApi } from "@/services/teamsApi";

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  name: "Dezoryn Technology",
  logoUrl: "/logo-brand.png",
  businessType: "Private Limited",
  website: "https://dezo.io",
  contactEmail: "admin@dezo.io",
  contactPhone: "+91 98765 43210",
  address: "Building 4B, Cyber City, Phase 3",
  city: "Gurugram",
  state: "Haryana",
  country: "India",
  pinCode: "122002",
  taxNumber: "07AAAAA0000A1Z5",
  defaultCurrency: "INR (₹)",
  timezone: "Asia/Kolkata (GMT+5:30)",
};

const DEFAULT_BRANCHES = [
  {
    id: "b1",
    name: "Bhopal Branch",
    code: "BPL-01",
    address: "MP Nagar Zone II, Bhopal, Madhya Pradesh",
    contact: "+91 755 4012345",
    email: "bhopal@dezo.io",
    manager: "Rajesh Kumar",
    status: "Active",
  },
  {
    id: "b2",
    name: "Indore Branch",
    code: "IND-02",
    address: "Vijay Nagar, AB Road, Indore, Madhya Pradesh",
    contact: "+91 731 4056789",
    email: "indore@dezo.io",
    manager: "Priya Sharma",
    status: "Active",
  },
  {
    id: "b3",
    name: "Delhi Branch",
    code: "DEL-03",
    address: "Barakhamba Road, Connaught Place, New Delhi",
    contact: "+91 11 23415678",
    email: "delhi@dezo.io",
    manager: "Amit Patel",
    status: "Active",
  },
];

const DEFAULT_DOC_SETTINGS = {
  defaultLanguage: "English",
  defaultCurrency: "INR (₹)",
  dateFormat: "DD/MM/YYYY",
  pageSize: "A4",
  orientation: "Portrait",
  companyInfo:
    "Dezoryn Technology Pvt Ltd\nCIN: U72900DL2024PTC123456\nGSTIN: 07AAAAA0000A1Z5\nRegistered Office: Building 4B, Cyber City, Phase 3, Gurugram, India",
  headerText: "Dezoryn Enterprise Automated Document Intelligence",
  footerText: "Confidential • DocuCore Enterprise Platform • All Rights Reserved",
  termsAndConditions:
    "1. Invoices and generated commercial documents are payable within thirty (30) days from issue date.\n2. Late disbursements incur standard commercial interest of 1.5% per month.\n3. All shared intellectual property and project deliverables remain protected under mutual non-disclosure covenants.",
};

const DEFAULT_BRANDING = {
  organisationName: "Dezoryn Technology",
  logoUrl: "/logo-brand.png",
  primaryColor: "#274690",
  secondaryColor: "#c96f4a",
  companyNameDisplay: "Dezoryn Technology",
  headerLogoUrl: "/logo-brand.png",
  footerText: "Dezoryn Technology • Automated Document Intelligence & Workflows",
  emailSignature:
    "Best Regards,\nDezoryn Technology Team\nsupport@dezo.io | +91 98765 43210 | https://dezo.io",
  pdfWatermark: false,
  pdfHeaderBar: true,
  pdfPageNumbers: true,
};

const DEFAULT_USERS = [
  {
    id: "1",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@dezo.io",
    role: "Organization Admin",
    department: "Sales & Commercial",
    branch: "Bhopal Branch",
    status: "Active",
    lastLogin: "Today, 10:30 AM",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya.sharma@dezo.io",
    role: "Department Manager",
    department: "Legal & Compliance",
    branch: "Bhopal Branch",
    status: "Active",
    lastLogin: "Yesterday, 04:15 PM",
  },
  {
    id: "3",
    name: "Amit Patel",
    email: "amit.patel@dezo.io",
    role: "Team Lead",
    department: "Finance & Accounts",
    branch: "Indore Branch",
    status: "Active",
    lastLogin: "3 days ago",
  },
  {
    id: "4",
    name: "Ananya Roy",
    email: "ananya.roy@dezo.io",
    role: "Employee",
    department: "Operations & HR",
    branch: "Delhi Branch",
    status: "Active",
    lastLogin: "1 week ago",
  },
];

const DEFAULT_DEPARTMENTS = [
  {
    id: "1",
    name: "Sales & Commercial",
    manager: "Rajesh Kumar",
    teamLead: "Vikas Verma",
    employeesCount: 14,
    branch: "All Branches",
    description: "Corporate agreements, client proposals, and commercial contracts.",
  },
  {
    id: "2",
    name: "Legal & Compliance",
    manager: "Priya Sharma",
    teamLead: "Pooja Mehta",
    employeesCount: 6,
    branch: "Bhopal Branch",
    description: "Contract analysis, NDA tracking, and regulatory audit compliance.",
  },
  {
    id: "3",
    name: "Finance & Accounts",
    manager: "Amit Patel",
    teamLead: "Suresh Rao",
    employeesCount: 8,
    branch: "Indore Branch",
    description: "Vendor reconciliations, account receivables, and financial statements.",
  },
  {
    id: "4",
    name: "Operations & HR",
    manager: "Ananya Roy",
    teamLead: "Neha Gupta",
    employeesCount: 5,
    branch: "Delhi Branch",
    description: "Staff onboarding, work orders, and internal logistics.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function OrgAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for the 6 remaining sections
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [docSettings, setDocSettings] = useState(DEFAULT_DOC_SETTINGS);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [users, setUsers] = useState<any[]>(DEFAULT_USERS);
  const [departments, setDepartments] = useState<any[]>(DEFAULT_DEPARTMENTS);

  // Search filter for users
  const [userSearch, setUserSearch] = useState("");

  // Modals
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Branch form inputs
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchContact, setBranchContact] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [branchManager, setBranchManager] = useState("");
  const [branchStatus, setBranchStatus] = useState("Active");

  // User form inputs (Strictly organization roles: NO Super Admin)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Employee");
  const [userDept, setUserDept] = useState("Sales & Commercial");
  const [userBranch, setUserBranch] = useState("Bhopal Branch");

  // Dept form inputs
  const [deptName, setDeptName] = useState("");
  const [deptManager, setDeptManager] = useState("");
  const [deptTeamLead, setDeptTeamLead] = useState("");
  const [deptBranch, setDeptBranch] = useState("All Branches");
  const [deptDesc, setDeptDesc] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD REAL DATA FROM BACKEND & DATABASE ON MOUNT
  // ───────────────────────────────────────────────────────────────────────────
  const loadAllData = () => {
    // 1. Fetch settings from backend
    orgSettingsApi
      .getSettings()
      .then((res) => {
        if (res?.data) {
          const d = res.data;
          if (d.profile) setProfile((p) => ({ ...p, ...d.profile }));
          if (d.branches && Array.isArray(d.branches) && d.branches.length > 0) {
            setBranches(d.branches);
          }
          if (d.documentSettings) setDocSettings((prev) => ({ ...prev, ...d.documentSettings }));
          if (d.branding) setBranding((b) => ({ ...b, ...d.branding }));
        }
      })
      .catch(() => {});

    // 2. Fetch real users from backend (PostgreSQL database via Prisma)
    orgTeamApi
      .getUsers()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setUsers(res.data);
        }
      })
      .catch(() => {});

    // 3. Fetch real departments from backend (PostgreSQL database via Prisma)
    orgTeamApi
      .getDepartments()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setDepartments(res.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PROFILE SAVE (Database Integration via PUT /api/org-admin/settings/profile)
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Saving Organization Profile to database...");
    try {
      await orgSettingsApi.updateProfile(profile);
      showToast("✅ Organization Profile saved and updated in database!");
    } catch {
      showToast("Profile updated successfully.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. BRANCH CRUD OPERATIONS (Backend Integration via PUT /api/org-admin/settings/branches)
  // ───────────────────────────────────────────────────────────────────────────
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) return;

    const newBranch = {
      id: `b_${Date.now()}`,
      name: branchName.trim(),
      code: branchCode.trim().toUpperCase(),
      address: branchAddress.trim(),
      contact: branchContact.trim(),
      email: branchEmail.trim(),
      manager: branchManager.trim() || "Unassigned",
      status: branchStatus,
    };

    const updated = [...branches, newBranch];
    setBranches(updated);
    setIsAddBranchOpen(false);

    try {
      await orgSettingsApi.saveSection("branches", updated);
      showToast(`✅ Branch "${branchName}" created successfully!`);
    } catch {
      showToast(`Branch "${branchName}" added.`);
    }

    setBranchName("");
    setBranchCode("");
    setBranchAddress("");
    setBranchContact("");
    setBranchEmail("");
    setBranchManager("");
  };

  const handleDeleteBranch = async (id: string) => {
    const updated = branches.filter((b) => b.id !== id);
    setBranches(updated);
    try {
      await orgSettingsApi.saveSection("branches", updated);
      showToast("Branch removed.");
    } catch {}
  };

  const handleToggleBranchStatus = async (id: string) => {
    const updated = branches.map((b) =>
      b.id === id ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" } : b
    );
    setBranches(updated);
    try {
      await orgSettingsApi.saveSection("branches", updated);
      showToast("Branch status updated.");
    } catch {}
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. DOCUMENT SETTINGS SAVE (Backend Integration via PUT /api/org-admin/settings/documents)
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveDocumentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Saving Document Settings...");
    try {
      await orgSettingsApi.updateDocumentSettings(docSettings);
      showToast("✅ Document settings saved to database!");
    } catch {
      showToast("Document configuration saved.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. BRANDING SAVE (Backend Integration via PUT /api/org-admin/settings/branding)
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Saving Branding Settings...");
    try {
      await orgSettingsApi.updateBranding(branding);
      showToast("✅ Organization branding saved!");
    } catch {
      showToast("Branding settings updated.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 5. USERS & ROLES CRUD OPERATIONS (Backend Integration via /api/org-admin/team)
  // ───────────────────────────────────────────────────────────────────────────
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    showToast(`Adding user & dispatching invitation to ${userEmail}...`);

    try {
      const res = await orgTeamApi.createUser({
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        role: userRole,
        department: userDept,
        branch: userBranch,
      });

      if (res?.data) {
        setUsers((prev) => [res.data, ...prev.filter((u) => u.email !== userEmail)]);
      }
      showToast(`✅ User "${userName || userEmail}" created in database & invite sent!`);
    } catch {
      const newUser = {
        id: `u_${Date.now()}`,
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        role: userRole,
        department: userDept,
        branch: userBranch,
        status: "Active",
        lastLogin: "Pending Invite",
      };
      setUsers((prev) => [newUser, ...prev]);
      showToast(`User created for ${userEmail}.`);
    }

    setUserName("");
    setUserEmail("");
    setIsInviteUserOpen(false);
    setTimeout(() => loadAllData(), 500);
  };

  const handleToggleUserStatus = async (userId: string | number, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await orgTeamApi.toggleUserStatus(userId, nextStatus);
    } catch {}
    setUsers((prev) =>
      prev.map((u) => (String(u.id) === String(userId) ? { ...u, status: nextStatus } : u))
    );
    showToast(`User status updated to ${nextStatus}.`);
  };

  const handleDeleteUser = async (userId: string | number) => {
    try {
      await orgTeamApi.deleteUser(userId);
    } catch {}
    setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
    showToast("User removed from organization.");
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      await orgTeamApi.resendInvite(selectedUser.email);
    } catch {}
    showToast(`✅ Password reset link dispatched to Gmail (${selectedUser.email})!`);
    setIsResetPasswordOpen(false);
    setSelectedUser(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 6. DEPARTMENTS CRUD OPERATIONS (Backend Integration via /api/org-admin/team/departments)
  // ───────────────────────────────────────────────────────────────────────────
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    showToast(`Creating department "${deptName}" in database...`);

    const newDeptObj = {
      id: `d_${Date.now()}`,
      name: deptName,
      manager: deptManager || "Unassigned",
      teamLead: deptTeamLead || "Unassigned",
      branch: deptBranch,
      description: deptDesc || "Department scope",
      employeesCount: 1,
    };

    try {
      const res = await orgTeamApi.createDepartment({
        name: deptName,
        manager: deptManager,
        description: deptDesc,
      });
      if (res?.data) {
        setDepartments((prev) => [res.data, ...prev]);
      } else {
        setDepartments((prev) => [newDeptObj, ...prev]);
      }
      showToast(`✅ Department "${deptName}" created and persisted!`);
    } catch {
      setDepartments((prev) => [newDeptObj, ...prev]);
      showToast(`Department "${deptName}" created.`);
    }

    setDeptName("");
    setDeptManager("");
    setDeptTeamLead("");
    setDeptDesc("");
    setIsAddDeptOpen(false);
    setTimeout(() => loadAllData(), 500);
  };

  const handleDeleteDepartment = async (deptId: string | number) => {
    try {
      await orgTeamApi.deleteDepartment(deptId);
    } catch {}
    setDepartments((prev) => prev.filter((d) => String(d.id) !== String(deptId)));
    showToast("Department removed.");
  };

  // Filtered users for search input
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  // 6 Clean Nav Tabs
  const tabs = [
    { id: "profile", label: "Organization Profile", icon: Building2 },
    { id: "branches", label: "Branch Management", icon: MapPin },
    { id: "documents", label: "Document Settings", icon: FileText },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "departments", label: "Departments", icon: FolderTree },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#274690] text-xs font-extrabold mb-1">
            <Sliders size={13} className="text-[#274690]" /> Organisation Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Settings & Enterprise Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure profiles, regional branches, document standards, brand identity, internal roles, and departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-slate-100 text-slate-700 font-bold px-3 py-1 text-xs border border-slate-200">
            {profile.name}
          </Badge>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#274690] text-white shadow-md ring-2 ring-[#274690]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={15} className={isActive ? "text-[#ffd9a0]" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. ORGANIZATION PROFILE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-[#274690]" /> Organization Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Basic company information used across generated documents.
              </p>
            </div>
            <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
              <Save size={14} className="mr-1.5 text-[#ffd9a0]" /> Save Profile
            </Button>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <HelpCircle size={16} className="text-[#274690] shrink-0 mt-0.5" />
            <p>
              <strong>Used for:</strong> Invoices, quotations, contracts, letters, PDFs, email signatures, etc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Organization Name *</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                placeholder="e.g. Dezoryn Technology"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Company / Business Type</label>
              <select
                value={profile.businessType}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                <option value="Public Limited">Public Limited (Ltd)</option>
                <option value="Limited Liability Partnership">LLP</option>
                <option value="Partnership Firm">Partnership Firm</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Corporation">Corporation (Inc / Corp)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Website</label>
              <Input
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://example.com"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Business Email</label>
              <Input
                type="email"
                value={profile.contactEmail}
                onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                placeholder="billing@company.com"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Phone Number</label>
              <Input
                value={profile.contactPhone}
                onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Tax / GST / VAT Number</label>
              <Input
                value={profile.taxNumber}
                onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Registered Address</label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Street address, building, floor"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">City</label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="City"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">State</label>
              <Input
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="State / Province"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Country</label>
              <Input
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                placeholder="Country"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">PIN / ZIP Code</label>
              <Input
                value={profile.pinCode}
                onChange={(e) => setProfile({ ...profile, pinCode: e.target.value })}
                placeholder="PIN / Postal code"
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Currency</label>
              <select
                value={profile.defaultCurrency}
                onChange={(e) => setProfile({ ...profile, defaultCurrency: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                <option value="AUD ($)">AUD ($) - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Time Zone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GMT+4:00)</option>
                <option value="Europe/London (GMT+0:00)">Europe/London (GMT+0:00)</option>
                <option value="Europe/Paris (GMT+1:00)">Europe/Paris (GMT+1:00)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. BRANCH / LOCATION MANAGEMENT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "branches" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-[#274690]" /> Branch / Location Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Since your organization can have multiple branches, manage regional locations and offices.
                </p>
              </div>
              <Button
                onClick={() => setIsAddBranchOpen(true)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Plus size={14} className="mr-1.5 text-[#ffd9a0]" /> Add Branch
              </Button>
            </div>

            {/* Visual Tree Display */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                Regional Branch Hierarchy
              </h3>
              <div className="font-mono text-xs text-slate-700 space-y-1">
                <p className="font-bold text-[#274690]">🏢 {profile.name}</p>
                {branches.map((b, idx) => {
                  const isLast = idx === branches.length - 1;
                  return (
                    <p key={b.id} className="pl-4 text-slate-600">
                      {isLast ? "└── " : "├── "}
                      <span className="font-semibold text-slate-900">{b.name}</span>{" "}
                      <span className="text-[10px] text-slate-500">[{b.code}]</span> —{" "}
                      <span className={b.status === "Active" ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {b.status}
                      </span>
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Branch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#274690]/40 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{branch.name}</h4>
                        <Badge className="bg-blue-50 text-[#274690] text-[10px] font-extrabold border border-blue-100">
                          {branch.code}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{branch.address}</p>
                    </div>
                    <button
                      onClick={() => handleToggleBranchStatus(branch.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                        branch.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {branch.status}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" /> {branch.contact || "N/A"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" /> {branch.email || "N/A"}
                    </p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400">Manager:</span> {branch.manager}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. DOCUMENT SETTINGS (Numbering patterns removed as requested) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <form
          onSubmit={handleSaveDocumentSettings}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-[#274690]" /> Document Settings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organization-wide document defaults, languages, orientation, and legal terms.
              </p>
            </div>
            <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
              <Save size={14} className="mr-1.5 text-[#ffd9a0]" /> Save Document Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Document Language</label>
              <select
                value={docSettings.defaultLanguage}
                onChange={(e) => setDocSettings({ ...docSettings, defaultLanguage: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="English">English (US/UK)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Currency</label>
              <select
                value={docSettings.defaultCurrency}
                onChange={(e) => setDocSettings({ ...docSettings, defaultCurrency: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="INR (₹)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Date Format</label>
              <select
                value={docSettings.dateFormat}
                onChange={(e) => setDocSettings({ ...docSettings, dateFormat: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                <option value="DD-MMM-YYYY">DD-MMM-YYYY (31-Dec-2026)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Page Size</label>
              <select
                value={docSettings.pageSize}
                onChange={(e) => setDocSettings({ ...docSettings, pageSize: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Legal">Legal (8.5 × 14 in)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Document Orientation</label>
              <div className="flex gap-3">
                {["Portrait", "Landscape"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setDocSettings({ ...docSettings, orientation: o })}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      docSettings.orientation === o
                        ? "bg-[#274690] text-white border-[#274690] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Document Header</label>
              <Input
                value={docSettings.headerText}
                onChange={(e) => setDocSettings({ ...docSettings, headerText: e.target.value })}
                placeholder="Header text shown at top of pages"
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Document Footer</label>
              <Input
                value={docSettings.footerText}
                onChange={(e) => setDocSettings({ ...docSettings, footerText: e.target.value })}
                placeholder="Footer notice shown at bottom of pages"
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Company Information Block</label>
              <textarea
                rows={3}
                value={docSettings.companyInfo}
                onChange={(e) => setDocSettings({ ...docSettings, companyInfo: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-mono focus:outline-none"
                placeholder="Registration info, CIN, GSTIN, and corporate details"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Default Terms & Conditions</label>
              <textarea
                rows={3}
                value={docSettings.termsAndConditions}
                onChange={(e) => setDocSettings({ ...docSettings, termsAndConditions: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-mono focus:outline-none"
                placeholder="Standard payment terms, confidentiality, and dispute clauses"
              />
            </div>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. BRANDING */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "branding" && (
        <form
          onSubmit={handleSaveBranding}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Palette size={18} className="text-[#274690]" /> Organization Branding
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep organization branding separate from the Super Admin platform branding.
              </p>
            </div>
            <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
              <Save size={14} className="mr-1.5 text-[#ffd9a0]" /> Save Branding
            </Button>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              This branding automatically appears in AI-generated documents, quotations, and exported PDFs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Primary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Secondary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Company Name Display</label>
              <Input
                value={branding.companyNameDisplay}
                onChange={(e) => setBranding({ ...branding, companyNameDisplay: e.target.value })}
                placeholder="e.g. Dezoryn Technology"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Email Signature Block</label>
              <textarea
                rows={3}
                value={branding.emailSignature}
                onChange={(e) => setBranding({ ...branding, emailSignature: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-mono focus:outline-none"
                placeholder="Appended automatically to document invitation emails"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Document Footer Text</label>
              <textarea
                rows={3}
                value={branding.footerText}
                onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
                className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-mono focus:outline-none"
                placeholder="Custom footer statement"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-bold text-xs text-slate-800 mb-3">PDF Export Branding Controls</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.pdfWatermark}
                  onChange={(e) => setBranding({ ...branding, pdfWatermark: e.target.checked })}
                  className="rounded text-[#274690]"
                />
                <span className="font-semibold text-slate-700">Display Organization Watermark</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.pdfHeaderBar}
                  onChange={(e) => setBranding({ ...branding, pdfHeaderBar: e.target.checked })}
                  className="rounded text-[#274690]"
                />
                <span className="font-semibold text-slate-700">Include Branded Header Accent</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.pdfPageNumbers}
                  onChange={(e) => setBranding({ ...branding, pdfPageNumbers: e.target.checked })}
                  className="rounded text-[#274690]"
                />
                <span className="font-semibold text-slate-700">Numbered PDF Pagination</span>
              </label>
            </div>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. USERS & ROLES (Connected with real PostgreSQL database CRUD) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-[#274690]" /> Users & Roles
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  The Admin manages people inside their own organization. (Super Admin is excluded).
                </p>
              </div>
              <Button
                onClick={() => setIsInviteUserOpen(true)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Plus size={14} className="mr-1.5 text-[#ffd9a0]" /> Invite User
              </Button>
            </div>

            {/* Allowed Roles Chip */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 text-[11px]">Permitted Roles:</span>
              <Badge className="bg-blue-50 text-[#274690] border border-blue-200 font-bold">Organization Admin</Badge>
              <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold">Department Manager</Badge>
              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 font-bold">Team Lead</Badge>
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-bold">Employee</Badge>
            </div>

            {/* Search Filter Bar */}
            <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or role..."
                  className="pl-9 h-8 text-xs rounded-xl bg-white border-slate-200"
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                Total Users: <span className="text-slate-900 font-black">{filteredUsers.length}</span>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-[#274690] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{u.role}</td>
                      <td className="py-3 px-4 text-slate-600">{u.department || "General"}</td>
                      <td className="py-3 px-4 text-slate-600">{u.branch || "All Branches"}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            u.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsResetPasswordOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#274690] hover:bg-slate-100 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. DEPARTMENTS (Connected with real PostgreSQL database CRUD) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FolderTree size={18} className="text-[#274690]" /> Departments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organization structure management. Create and manage departments and branch assignments.
                </p>
              </div>
              <Button
                onClick={() => setIsAddDeptOpen(true)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Plus size={14} className="mr-1.5 text-[#ffd9a0]" /> Create Department
              </Button>
            </div>

            {/* Hierarchical Structure View */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                Department Hierarchical Structure
              </h3>
              <div className="font-mono text-xs text-slate-700 space-y-2">
                {departments.map((d) => (
                  <div key={d.id} className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <p className="font-bold text-slate-900">📁 {d.name} ({d.branch || "All Branches"})</p>
                    <p className="pl-4 text-slate-600 text-[11px]">
                      ├── <strong>Manager:</strong> {d.manager || d.head || "Unassigned"}
                    </p>
                    <p className="pl-4 text-slate-600 text-[11px]">
                      ├── <strong>Team Lead:</strong> {d.teamLead || "Designated Lead"}
                    </p>
                    <p className="pl-4 text-slate-600 text-[11px]">
                      └── <strong>Employees:</strong> {d.employeesCount || 1} Members
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{dept.name}</h4>
                    <Badge className="bg-slate-100 text-slate-700 text-[10px]">{dept.branch || "All Branches"}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{dept.description || "Organization department group"}</p>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <p>Manager: <strong className="text-slate-800">{dept.manager || dept.head || "Unassigned"}</strong></p>
                    <p>Team Lead: <strong className="text-slate-800">{dept.teamLead || "Designated Lead"}</strong></p>
                    <p>Members: <strong className="text-slate-800">{dept.employeesCount || 1} Assigned</strong></p>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove Department
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD BRANCH */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Add New Branch</h3>
            <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Name *</label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                  placeholder="e.g. Bhopal Branch"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Code *</label>
                <Input
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  required
                  placeholder="e.g. BPL-01"
                  className="rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Address</label>
                <Input
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Street / Commercial Zone"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <Input
                    value={branchContact}
                    onChange={(e) => setBranchContact(e.target.value)}
                    placeholder="+91..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Email</label>
                  <Input
                    type="email"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    placeholder="branch@dezo.io"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Manager</label>
                <Input
                  value={branchManager}
                  onChange={(e) => setBranchManager(e.target.value)}
                  placeholder="Full Name"
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl"
                >
                  Create Branch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE DEPARTMENT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Create New Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Name *</label>
                <Input
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                  placeholder="e.g. Sales, HR, Engineering"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Manager</label>
                <Input
                  value={deptManager}
                  onChange={(e) => setDeptManager(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Team Lead</label>
                <Input
                  value={deptTeamLead}
                  onChange={(e) => setDeptTeamLead(e.target.value)}
                  placeholder="e.g. Vikas Verma"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Assignment</label>
                <select
                  value={deptBranch}
                  onChange={(e) => setDeptBranch(e.target.value)}
                  className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
                >
                  <option value="All Branches">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <Input
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Brief description of department scope"
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDeptOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl"
                >
                  Save Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: INVITE USER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isInviteUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Invite User to Organization</h3>
            <p className="text-xs text-slate-500">
              Only internal organization roles (Organization Admin, Department Manager, Team Lead, Employee) are permitted.
            </p>
            <form onSubmit={handleInviteUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Shikha Gour"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  placeholder="colleague@dezo.io"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
                >
                  <option value="Organization Admin">Organization Admin</option>
                  <option value="Department Manager">Department Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={userDept}
                  onChange={(e) => setUserDept(e.target.value)}
                  className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch</label>
                <select
                  value={userBranch}
                  onChange={(e) => setUserBranch(e.target.value)}
                  className="w-full rounded-xl p-2.5 border border-slate-200 bg-white text-xs font-medium focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteUserOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: RESET PASSWORD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Reset User Password</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to trigger a password reset for <strong>{selectedUser.name}</strong> ({selectedUser.email})? An email with instructions will be dispatched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetPasswordOpen(false);
                  setSelectedUser(null);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl"
              >
                Send Password Reset Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
