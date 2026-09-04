"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string;

  useEffect(() => {
    router.replace(`/org-admin/clients-crm/${clientId}/overview`);
  }, [clientId, router]);

  return null;
}
