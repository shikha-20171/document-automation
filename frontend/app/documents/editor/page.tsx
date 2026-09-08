"use client";

import React, { Suspense } from "react";
import CleanDocumentBuilder from "@/components/builder/CleanDocumentBuilder";

export default function UniversalDocumentEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Document Editor...</div>}>
      <CleanDocumentBuilder role="STAFF" roleDisplayName="User" />
    </Suspense>
  );
}
