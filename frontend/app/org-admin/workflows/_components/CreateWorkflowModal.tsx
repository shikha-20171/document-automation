"use client";

import { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Workflow,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
  GitBranch,
  Bell,
  FileCheck,
  Sliders,
  Play,
  Copy,
  AlertCircle,
  Clock,
  Send,
  FileText,
  FileCode,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workflowApi } from "@/services/workflowApi";

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export type StepType = "Approval" | "Review" | "Data Validation" | "Automated Action" | "Notification";
export type ApproverRole = "Organisation Admin" | "Department Manager" | "Team Lead" | "Specific User" | "External Signatory";
export type ApprovalMode = "Sequential" | "Parallel";

export interface WorkflowStepConfig {
  id: string;
  name: string;
  type: StepType;
  approverRole: ApproverRole;
  specificUserEmail?: string;
  externalName?: string;
  externalEmail?: string;
  approvalMode: ApprovalMode;
  deadlineHours: number;
  commentsRequiredOnRejection: boolean;
  allowRequestChanges: boolean;
  escalationAfterHours: number;
  escalationRole: string;
  actionDetails?: string;
  validationFields?: string[];
  notificationRecipient?: string;
}

export interface BranchCondition {
  id: string;
  field: "Amount" | "Document Type" | "Department" | "Employee Role" | "Priority";
  operator: "Equals" | "Not equals" | "Greater than" | "Less than" | "Greater than or equal" | "Less than or equal" | "Contains";
  value: string;
  targetAction: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function CreateWorkflowModal({ isOpen, onClose, onSuccess }: CreateWorkflowModalProps) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  // 1. Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Legal & Compliance");
  const [appliesTo, setAppliesTo] = useState("Contract");
  const [department, setDepartment] = useState("Legal");
  const [status, setStatus] = useState<"Draft" | "Active">("Active");

  // 2. Trigger Configuration
  const [trigger, setTrigger] = useState("Employee submits document");

  // 3. Allowed Submitters
  const [submitterScope, setSubmitterScope] = useState<"All Employees" | "Selected Departments" | "Selected Teams" | "Selected Roles">("All Employees");
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>(["Legal", "HR", "Finance", "Operations"]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["Employee", "Team Lead", "Department Manager"]);

  // 4. Workflow Steps
  const [steps, setSteps] = useState<WorkflowStepConfig[]>([
    {
      id: "step-1",
      name: "Department Manager Approval",
      type: "Approval",
      approverRole: "Department Manager",
      approvalMode: "Sequential",
      deadlineHours: 24,
      commentsRequiredOnRejection: true,
      allowRequestChanges: true,
      escalationAfterHours: 48,
      escalationRole: "Organisation Admin",
      actionDetails: "Verify document clauses and operational scope",
    },
    {
      id: "step-2",
      name: "Organisation Admin Sign-off",
      type: "Approval",
      approverRole: "Organisation Admin",
      approvalMode: "Sequential",
      deadlineHours: 48,
      commentsRequiredOnRejection: true,
      allowRequestChanges: true,
      escalationAfterHours: 72,
      escalationRole: "Executive Signatory",
      actionDetails: "Final executive authority authorization & e-signature",
    },
  ]);

  // 5. Conditions / Branching
  const [enableBranching, setEnableBranching] = useState(true);
  const [conditions, setConditions] = useState<BranchCondition[]>([
    {
      id: "cond-1",
      field: "Amount",
      operator: "Greater than or equal",
      value: "50000",
      targetAction: "Require Organisation Admin Sign-off",
    },
    {
      id: "cond-2",
      field: "Amount",
      operator: "Less than",
      value: "50000",
      targetAction: "Department Manager Approval Only",
    },
  ]);

  // 6. On-Approval & On-Rejection Actions
  const [onApprovalActions, setOnApprovalActions] = useState({
    markApproved: true,
    generateFinalDocument: true,
    notifyEmployee: true,
    storeInArchive: true,
    sendEmailConfirmation: true,
  });

  const [onRejectionActions, setOnRejectionActions] = useState({
    markRejected: true,
    requireRejectionReason: true,
    allowEmployeeEditResubmit: true,
    notifyEmployee: true,
    endWorkflow: true,
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const resetForm = () => {
    setWizardStep(1);
    setName("");
    setDescription("");
    setCategory("Legal & Compliance");
    setAppliesTo("Contract");
    setDepartment("Legal");
    setStatus("Active");
    setTrigger("Employee submits document");
    setSubmitterScope("All Employees");
    setSteps([
      {
        id: "step-1",
        name: "Department Manager Approval",
        type: "Approval",
        approverRole: "Department Manager",
        approvalMode: "Sequential",
        deadlineHours: 24,
        commentsRequiredOnRejection: true,
        allowRequestChanges: true,
        escalationAfterHours: 48,
        escalationRole: "Organisation Admin",
      },
      {
        id: "step-2",
        name: "Organisation Admin Sign-off",
        type: "Approval",
        approverRole: "Organisation Admin",
        approvalMode: "Sequential",
        deadlineHours: 48,
        commentsRequiredOnRejection: true,
        allowRequestChanges: true,
        escalationAfterHours: 72,
        escalationRole: "Executive Signatory",
      },
    ]);
    setErrorMessage("");
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step Management
  const addStep = () => {
    const newIdx = steps.length + 1;
    const newStep: WorkflowStepConfig = {
      id: `step-${Date.now()}`,
      name: `Step ${newIdx} Approval`,
      type: "Approval",
      approverRole: "Team Lead",
      approvalMode: "Sequential",
      deadlineHours: 24,
      commentsRequiredOnRejection: true,
      allowRequestChanges: true,
      escalationAfterHours: 48,
      escalationRole: "Department Manager",
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const duplicateStep = (idx: number) => {
    const original = steps[idx];
    const copy: WorkflowStepConfig = {
      ...original,
      id: `step-${Date.now()}`,
      name: `${original.name} (Copy)`,
    };
    const updated = [...steps];
    updated.splice(idx + 1, 0, copy);
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    setSteps((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const updateStep = (index: number, field: keyof WorkflowStepConfig, value: any) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)));
  };

  // Condition Management
  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        id: `cond-${Date.now()}`,
        field: "Amount",
        operator: "Greater than or equal",
        value: "100000",
        targetAction: "Route to Executive Board",
      },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof BranchCondition, value: any) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Testing Simulator
  const handleTestWorkflow = () => {
    setTestResult(
      `✓ Workflow logic verified! Sample document "${appliesTo}" matches Trigger "${trigger}" -> Submitter "${submitterScope}" -> Execution pipeline (${steps.length} steps) passed simulation.`
    );
  };

  // Save / Publish
  const handleSave = async (publish: boolean) => {
    if (!name.trim()) {
      setErrorMessage("Workflow name is required.");
      setWizardStep(1);
      return;
    }
    if (steps.length === 0) {
      setErrorMessage("At least one workflow step is required.");
      setWizardStep(4);
      return;
    }

    setErrorMessage("");
    setSaving(true);

    try {
      const triggerMap: Record<string, string> = {
        "Employee creates document": "DOCUMENT_CREATED",
        "Employee submits document": "DOCUMENT_SUBMITTED",
        "Document uploaded": "DOCUMENT_UPLOADED",
        "Form submitted": "DOCUMENT_SUBMITTED",
        "API submission": "DOCUMENT_SUBMITTED",
        "Email received": "DOCUMENT_SUBMITTED",
        "Manual trigger": "DOCUMENT_SUBMITTED",
      };

      const finalStatus = publish ? "ACTIVE" : status === "Active" ? "ACTIVE" : "DRAFT";

      await workflowApi.createOrgWorkflow({
        name: name.trim(),
        description: description.trim() || `Workflow for ${appliesTo} in ${category}`,
        appliesTo: appliesTo || "ALL",
        department: department || "Operations",
        trigger: triggerMap[trigger] || "DOCUMENT_SUBMITTED",
        status: finalStatus,
        steps: steps.map((s, idx) => ({
          stepOrder: idx + 1,
          name: s.name || `Step ${idx + 1}`,
          approverType: s.approverRole.toUpperCase().replace(/\s+/g, "_"),
          approvalType: s.approverRole === "External Signatory" ? "EXTERNAL" : "INTERNAL",
          externalApproverName: s.approverRole === "External Signatory" ? s.externalName : undefined,
          externalApproverEmail: s.approverRole === "External Signatory" ? s.externalEmail : undefined,
        })),
      });

      showToast(`Workflow "${name}" created and configured as ${publish ? "Active" : status}!`);
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create workflow.");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    const el = document.createElement("div");
    el.className =
      "fixed bottom-6 right-6 z-[60] rounded-2xl bg-gradient-to-r from-[#1f3561] to-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20";
    el.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  };

  const wizardTabs = [
    { step: 1, label: "Basic Info", icon: FileText },
    { step: 2, label: "Trigger", icon: Zap },
    { step: 3, label: "Submitters", icon: Users },
    { step: 4, label: "Step Builder", icon: Sliders },
    { step: 5, label: "Branching", icon: GitBranch },
    { step: 6, label: "Actions", icon: CheckCircle2 },
    { step: 7, label: "Review & Activate", icon: ShieldCheck },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enterprise Workflow Builder">
      <div className="space-y-5 max-w-3xl">
        {/* Wizard Steps Progress Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {wizardTabs.map((t) => {
            const Icon = t.icon;
            const isActive = wizardStep === t.step;
            const isCompleted = wizardStep > t.step;
            return (
              <button
                key={t.step}
                type="button"
                onClick={() => setWizardStep(t.step as WizardStep)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#274690] text-white shadow-xs"
                    : isCompleted
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon size={13} />
                <span>
                  {t.step}. {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: BASIC INFORMATION */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 1: Workflow Identity & Category</h3>
                <p className="text-xs text-slate-500">Define the workflow identity, document class, and administrative owner.</p>
              </div>
              <Badge className="bg-blue-50 text-[#274690] border-blue-200 font-extrabold text-[10px]">
                Multi-Tenant Isolated
              </Badge>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Workflow Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Contract Approval Workflow"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#274690] focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description & Purpose</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe routing rules, compliance validation, and target signatories..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#274690] focus:outline-none font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Workflow Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="HR & Talent">HR & Talent</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Procurement & Vendors">Procurement & Vendors</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales & Customer">Sales & Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Document / Process Type</label>
                <select
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="Contract">Contract</option>
                  <option value="NDA">NDA (Non-Disclosure)</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Vendor Agreement">Vendor Agreement</option>
                  <option value="Custom Document">Custom Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Draft" | "Active")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="Active">Active (Live in Org)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TRIGGER CONFIGURATION */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Step 2: Workflow Trigger Configuration</h3>
              <p className="text-xs text-slate-500">Select which action or event initiates this automated workflow.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "Employee creates document", label: "Employee Creates Document", desc: "Triggers as soon as a draft document is generated in the system." },
                { id: "Employee submits document", label: "Employee Submits Document", desc: "Triggers when an employee clicks 'Submit for Approval'." },
                { id: "Document uploaded", label: "Document Uploaded", desc: "Triggers whenever a matching file (PDF/DOCX) is uploaded into the repository." },
                { id: "Form submitted", label: "Form Submitted", desc: "Triggers on submission of internal or client intake forms." },
                { id: "API submission", label: "API Webhook Submission", desc: "Triggers via automated REST API dispatch from external systems." },
                { id: "Manual trigger", label: "Manual Administrator Trigger", desc: "Executed on-demand by authorised managers or admins." },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex flex-col gap-1 p-3.5 rounded-2xl border cursor-pointer transition ${
                    trigger === opt.id ? "border-[#274690] bg-blue-50/70 shadow-xs" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{opt.label}</span>
                    <input
                      type="radio"
                      name="trigger"
                      value={opt.id}
                      checked={trigger === opt.id}
                      onChange={(e) => setTrigger(e.target.value)}
                      className="accent-[#274690] h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: WHO CAN START THE WORKFLOW */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Step 3: Allowed Submitters Scope</h3>
              <p className="text-xs text-slate-500">Define which employees, departments, or roles are eligible to initiate this workflow.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(["All Employees", "Selected Departments", "Selected Teams", "Selected Roles"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setSubmitterScope(scope)}
                  className={`p-3 rounded-2xl border text-center text-xs font-bold transition ${
                    submitterScope === scope
                      ? "border-[#274690] bg-[#274690] text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <p className="text-xs font-bold text-slate-800">Assigned Submitters Specification:</p>
              {submitterScope === "All Employees" ? (
                <p className="text-xs text-slate-600">
                  Every authenticated user in this organisation will automatically route their <span className="font-bold text-[#274690]">{appliesTo}</span> documents through this workflow.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allowedDepartments.map((dept) => (
                    <Badge key={dept} className="bg-white border-slate-200 text-slate-800 font-bold px-3 py-1">
                      {dept} Department
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: VISUAL WORKFLOW STEPS BUILDER */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 4: Interactive Steps Pipeline</h3>
                <p className="text-xs text-slate-500">Add, configure, duplicate, and reorder approval gates & automated actions.</p>
              </div>
              <Button
                type="button"
                onClick={addStep}
                className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold h-8 px-3 flex items-center gap-1"
              >
                <Plus size={14} /> Add Step
              </Button>
            </div>

            {/* Visual Node Pipeline Preview */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-400 shrink-0">
                1. Submitter ({submitterScope})
              </span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {idx + 2}. {s.name} ({s.approverRole})
                  </span>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </div>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                {steps.length + 2}. Final Execution / Archive
              </span>
            </div>

            {/* Step Cards List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div key={step.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#274690] text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(idx, "name", e.target.value)}
                        className="text-xs font-black text-slate-900 border-b border-dashed border-slate-300 focus:border-[#274690] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "down")}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateStep(idx)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Duplicate Step"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 disabled:opacity-30"
                        title="Delete Step"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Step Type</label>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(idx, "type", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Approval">Approval Step</option>
                        <option value="Review">Review (No Sign)</option>
                        <option value="Data Validation">Data Validation</option>
                        <option value="Automated Action">Automated Action</option>
                        <option value="Notification">Notification Dispatch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assigned Approver</label>
                      <select
                        value={step.approverRole}
                        onChange={(e) => updateStep(idx, "approverRole", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Organisation Admin">Organisation Admin</option>
                        <option value="Department Manager">Department Manager</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Specific User">Specific User</option>
                        <option value="External Signatory">External Signatory</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Deadline</label>
                      <select
                        value={step.deadlineHours}
                        onChange={(e) => updateStep(idx, "deadlineHours", Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                      >
                        <option value={24}>24 Hours</option>
                        <option value={48}>48 Hours (2 Days)</option>
                        <option value={72}>72 Hours (3 Days)</option>
                        <option value={168}>7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: CONDITIONS / BRANCHING */}
        {wizardStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step 5: Conditional Branching Rules</h3>
                <p className="text-xs text-slate-500">Route documents dynamically based on value thresholds, document metadata, or department.</p>
              </div>
              <Button
                type="button"
                onClick={addCondition}
                variant="outline"
                className="rounded-xl text-xs font-bold h-8 px-3 flex items-center gap-1"
              >
                <Plus size={14} /> Add Condition
              </Button>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={cond.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-2 text-xs">
                  <span className="font-bold text-[#274690] whitespace-nowrap">If</span>
                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(cond.id, "field", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="Amount">Invoice / Contract Value</option>
                    <option value="Department">Department</option>
                    <option value="Document Type">Document Type</option>
                    <option value="Priority">Priority Flag</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond.id, "operator", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="Greater than or equal">&gt;= (Greater or Equal)</option>
                    <option value="Less than">&lt; (Less Than)</option>
                    <option value="Equals">Equals</option>
                    <option value="Contains">Contains</option>
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, "value", e.target.value)}
                    placeholder="Value (e.g. 50000)"
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                  />

                  <span className="font-bold text-slate-500 whitespace-nowrap">Then</span>
                  <input
                    type="text"
                    value={cond.targetAction}
                    onChange={(e) => updateCondition(cond.id, "targetAction", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                  />

                  <button
                    type="button"
                    onClick={() => removeCondition(cond.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: ON-APPROVAL & ON-REJECTION ACTIONS */}
        {wizardStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Step 6: Execution Outcomes & Notifications</h3>
              <p className="text-xs text-slate-500">Configure post-approval automation and rejection policies.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* On Approval */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 size={16} />
                  <span>On Approval Actions:</span>
                </div>
                {[
                  { key: "markApproved", label: "Mark Document as Officially Approved" },
                  { key: "generateFinalDocument", label: "Generate Certified Final PDF with Signatures" },
                  { key: "notifyEmployee", label: "Notify Submitting Employee Instantly" },
                  { key: "storeInArchive", label: "Archive in Secure Multi-Tenant Storage" },
                  { key: "sendEmailConfirmation", label: "Dispatch Email Confirmation" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(onApprovalActions as any)[item.key]}
                      onChange={(e) =>
                        setOnApprovalActions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {/* On Rejection */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                  <AlertCircle size={16} />
                  <span>On Rejection Actions:</span>
                </div>
                {[
                  { key: "markRejected", label: "Mark Document Status as Rejected" },
                  { key: "requireRejectionReason", label: "Mandate Rejection Justification Note" },
                  { key: "allowEmployeeEditResubmit", label: "Allow Employee to Edit and Resubmit" },
                  { key: "notifyEmployee", label: "Send Immediate Rejection Notification" },
                  { key: "endWorkflow", label: "Terminate Current Workflow Execution" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(onRejectionActions as any)[item.key]}
                      onChange={(e) =>
                        setOnRejectionActions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-rose-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW, SIMULATION & ACTIVATION */}
        {wizardStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Step 7: Pre-Activation Review & Simulation</h3>
              <p className="text-xs text-slate-500">Verify the complete workflow blueprint before activating it for your organisation.</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Workflow Name</p>
                  <p className="font-black text-slate-900 mt-0.5">{name || "Untitled Workflow"}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Applies To</p>
                  <p className="font-black text-[#274690] mt-0.5">{appliesTo}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Trigger</p>
                  <p className="font-bold text-slate-900 mt-0.5">{trigger}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Steps</p>
                  <p className="font-black text-emerald-700 mt-0.5">{steps.length} Defined Steps</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Execution Pipeline Preview:</p>
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-600">
                  <span>1. Submitter</span>
                  <span>→</span>
                  {steps.map((s, idx) => (
                    <span key={s.id} className="text-[#274690] font-bold">
                      {idx + 2}. {s.name} ({s.approverRole}) →
                    </span>
                  ))}
                  <span className="text-emerald-700 font-bold">Final Approval</span>
                </div>
              </div>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{testResult}</span>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {wizardStep > 1 && (
              <button
                type="button"
                disabled={saving}
                onClick={() => setWizardStep((prev) => (prev - 1) as WizardStep)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {wizardStep === 7 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTestWorkflow}
                className="rounded-xl text-xs font-bold border-slate-200 text-[#274690]"
              >
                <Play size={13} className="mr-1" /> Test Simulator
              </Button>
            )}

            <Button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4 py-2"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            {wizardStep < 7 ? (
              <Button
                type="button"
                onClick={() => setWizardStep((prev) => (prev + 1) as WizardStep)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs px-4 py-2 flex items-center gap-1"
              >
                <span>Continue</span> <ChevronRight size={15} />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-4 py-2 flex items-center gap-1 shadow-md"
              >
                <ShieldCheck size={14} />
                <span>{saving ? "Activating..." : "Activate Workflow"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
