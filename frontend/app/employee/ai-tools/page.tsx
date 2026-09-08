"use client";

import React from "react";
import UniversalAiToolsModule from "@/components/ai/UniversalAiToolsModule";

export default function EmployeeAiToolsPage() {
  return (
    <div className="pb-12 min-w-0 max-w-full">
      <UniversalAiToolsModule userRole="STAFF" roleDisplayName="Employee" />
    </div>
  );
}
