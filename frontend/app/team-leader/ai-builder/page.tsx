"use client";

import React, { Suspense } from "react";
import CleanDocumentBuilder from "@/components/builder/CleanDocumentBuilder";

export default function TeamLeaderDocumentBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Document Builder...</div>}>
      <CleanDocumentBuilder role="TEAM_LEADER" roleDisplayName="Team Lead" />
    </Suspense>
  );
}
