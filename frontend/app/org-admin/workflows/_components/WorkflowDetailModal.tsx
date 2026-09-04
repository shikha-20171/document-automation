"use client";

import { useState } from "react";
import { X, Play, Save, Settings, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkflowDetailModalProps {
  workflow: {
    id: string;
    name: string;
    appliesTo: string;
    steps: number;
    status: "Active" | "Draft" | "Paused";
    lastRun: string;
    description: string;
    trigger: string;
    deadline: string;
    reminder: string;
    escalation: string;
    commentsRequired: boolean;
    allowChanges: boolean;
  };
  onClose: () => void;
  onSave: () => void;
}

export default function WorkflowDetailModal({ workflow, onClose, onSave }: WorkflowDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [trigger, setTrigger] = useState(workflow.trigger);

  const timeline = [
    { name: "Document Submitted", status: "completed" as const },
    { name: "Manager Approved", status: "completed" as const },
    { name: "Finance Approved", status: "completed" as const },
    { name: "Admin Review", status: "current" as const },
    { name: "External Approval", status: "pending" as const },
    { name: "E-Signature", status: "pending" as const },
    { name: "Completed", status: "pending" as const },
  ];

  const getStepIcon = (status: "completed" | "current" | "pending") => {
    if (status === "completed") return <CheckCircle2 size={18} className="text-emerald-600" />;
    if (status === "current") return <Circle size={18} className="text-amber-500 fill-amber-500" />;
    return <Circle size={18} className="text-slate-300" />;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Workflow Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#274690] flex items-center justify-center border border-blue-100">
              <Settings size={24} />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-black text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full"
                />
              ) : (
                <h3 className="text-lg font-black text-slate-900">{workflow.name}</h3>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  workflow.status === "Active" ? "bg-emerald-100 text-emerald-800" :
                  workflow.status === "Draft" ? "bg-slate-100 text-slate-700" :
                  "bg-orange-100 text-orange-800"
                }`}>
                  {workflow.status}
                </Badge>
                <span className="text-[11px] text-slate-500">Applies to: {workflow.appliesTo}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button onClick={() => { setIsEditing(false); onSave(); }} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs">
                Save
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="text-xs font-bold rounded-xl">
                Edit
              </Button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Basic Info</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Description</span>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-2/3 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium focus:outline-none resize-none"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 max-w-[200px] text-right">{workflow.description}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applies To</span>
                  <span className="font-semibold text-slate-800">{workflow.appliesTo}</span>
                </div>
              </div>
            </div>

            {/* Trigger */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trigger</h4>
              {isEditing ? (
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                >
                  <option value="Document Created">Document Created</option>
                  <option value="Document Submitted for Approval">Document Submitted for Approval</option>
                  <option value="Document Updated">Document Updated</option>
                  <option value="Document Uploaded">Document Uploaded</option>
                </select>
              ) : (
                <p className="text-xs font-semibold text-slate-800">{workflow.trigger}</p>
              )}
            </div>

            {/* Approval Steps */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Approval Steps ({workflow.steps})</h4>
              <div className="space-y-2">
                {timeline.slice(0, workflow.steps).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {getStepIcon(step.status)}
                    <span className="font-medium text-slate-700">{step.name}</span>
                    {idx < workflow.steps - 1 && <ArrowRight size={12} className="text-slate-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Approval Settings */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Approval Settings</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deadline</span>
                  <span className="font-semibold text-slate-800">{workflow.deadline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reminder</span>
                  <span className="font-semibold text-slate-800">{workflow.reminder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escalation</span>
                  <span className="font-semibold text-slate-800">{workflow.escalation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comments Required</span>
                  <span className="font-semibold text-slate-800">{workflow.commentsRequired ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allow Changes</span>
                  <span className="font-semibold text-slate-800">{workflow.allowChanges ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Flow Preview */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Flow Preview</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {timeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border-2 ${
                        step.status === "completed" ? "bg-emerald-50 border-emerald-200" :
                        step.status === "current" ? "bg-amber-50 border-amber-300" :
                        "bg-slate-100 border-slate-200"
                      }`}>
                        {getStepIcon(step.status)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{step.name}</span>
                    </div>
                    {idx < timeline.length - 1 && (
                      <ArrowRight size={14} className="text-slate-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={onSave} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs flex items-center gap-2">
                <Save size={14} /> Save Draft
              </Button>
              <Button variant="outline" onClick={() => {}} className="text-xs font-bold rounded-2xl flex items-center gap-2">
                <Play size={14} /> Test Workflow
              </Button>
              <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2">
                Publish Workflow
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
