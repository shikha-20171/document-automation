"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DepartmentManagerAiBuilderRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/documents/editor${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="p-8 text-center text-slate-500">
      Redirecting to Enterprise Document Editor...
    </div>
  );
}

export default function DepartmentManagerAiBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <DepartmentManagerAiBuilderRedirect />
    </Suspense>
  );
}
