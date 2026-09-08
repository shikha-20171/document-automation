"use client";

import React from "react";
import DocumentWorkspace from "@/components/documents/DocumentWorkspace";

export default function EmployeeDocumentsPage() {
  return (
    <div className="pb-12 max-w-7xl mx-auto min-w-0">
      <DocumentWorkspace role="STAFF" roleDisplayName="Employee" />
    </div>
  );
}
