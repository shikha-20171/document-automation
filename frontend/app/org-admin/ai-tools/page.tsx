"use client";

import React from "react";
import UniversalAiToolsModule from "@/components/ai/UniversalAiToolsModule";

export default function OrgAdminAiToolsPage() {
  return (
    <div className="pb-12 min-w-0 max-w-full">
      <UniversalAiToolsModule
        userRole="ORGANISATION_ADMIN"
        roleDisplayName="Organisation Admin"
        hiddenAreas={["intelligence", "jobs"]}
      />
    </div>
  );
}
