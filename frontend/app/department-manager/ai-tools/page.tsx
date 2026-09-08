"use client";

import React from "react";
import UniversalAiToolsModule from "@/components/ai/UniversalAiToolsModule";

export default function DepartmentManagerAiToolsPage() {
  return (
    <div className="pb-12 min-w-0 max-w-full">
      <UniversalAiToolsModule userRole="DEPARTMENT_MANAGER" roleDisplayName="Department Manager" />
    </div>
  );
}