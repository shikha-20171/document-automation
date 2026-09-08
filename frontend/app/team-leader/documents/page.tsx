"use client";

import React from "react";
import DocumentWorkspace from "@/components/documents/DocumentWorkspace";

export default function TeamLeaderDocumentsPage() {
  return (
    <div className="pb-12 max-w-7xl mx-auto min-w-0">
      <DocumentWorkspace role="TEAM_LEADER" roleDisplayName="Team Leader" />
    </div>
  );
}
