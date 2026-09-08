"use client";

import React from "react";
import ApprovalWorkspace from "@/components/approvals/ApprovalWorkspace";

export default function DepartmentManagerApprovalsPage() {
  return (
    <div className="pb-12 max-w-7xl mx-auto min-w-0">
      <ApprovalWorkspace role="DEPARTMENT_MANAGER" roleDisplayName="Department Manager" />
    </div>
  );
}