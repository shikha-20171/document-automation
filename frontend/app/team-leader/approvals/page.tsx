"use client";

import React from "react";
import ApprovalWorkspace from "@/components/approvals/ApprovalWorkspace";

export default function TeamLeaderApprovalsPage() {
  return (
    <div className="pb-12 max-w-7xl mx-auto min-w-0">
      <ApprovalWorkspace role="TEAM_LEADER" roleDisplayName="Team Leader" />
    </div>
  );
}
