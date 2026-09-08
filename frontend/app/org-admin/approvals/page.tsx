"use client";

import React from "react";
import ApprovalWorkspace from "@/components/approvals/ApprovalWorkspace";

export default function OrgAdminApprovalsPage() {
  return (
    <div className="pb-12 max-w-7xl mx-auto min-w-0">
      <ApprovalWorkspace role="ORGANISATION_ADMIN" roleDisplayName="Organisation Admin" />
    </div>
  );
}
