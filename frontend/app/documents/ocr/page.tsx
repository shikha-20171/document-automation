"use client";

import React from "react";
import UnifiedOcrWorkspace from "@/components/ocr/UnifiedOcrWorkspace";

export default function DocumentOcrPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <UnifiedOcrWorkspace userRole="STAFF" />
      </div>
    </div>
  );
}
