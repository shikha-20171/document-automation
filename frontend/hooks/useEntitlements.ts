"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/axios";

export interface PlanMetadata {
  id: string;
  name: string;
  code?: string;
  status: string;
  billingCycle?: string;
  startDate?: string;
  expiryDate?: string;
}

export interface UsageData {
  aiRequests: number;
  ocrPages: number;
  usedStorageGB: number;
  totalFiles: number;
  activeUsers: number;
  periodStart?: string;
}

export interface EntitlementsResponse {
  plan: PlanMetadata;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  usage: UsageData;
}

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/organisation/entitlements");
      if (res.data?.data) {
        setEntitlements(res.data.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load entitlements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      if (!entitlements?.features) return true; // optimistic default
      return Boolean(entitlements.features[featureKey]);
    },
    [entitlements]
  );

  const getLimit = useCallback(
    (limitKey: string): number => {
      if (!entitlements?.limits || entitlements.limits[limitKey] === undefined) return 999999;
      return entitlements.limits[limitKey];
    },
    [entitlements]
  );

  const getUsage = useCallback(
    (key: keyof UsageData): number => {
      if (!entitlements?.usage) return 0;
      return Number(entitlements.usage[key] || 0);
    },
    [entitlements]
  );

  const isQuotaExceeded = useCallback(
    (resource: "ai" | "ocr" | "storage" | "users"): boolean => {
      if (!entitlements) return false;
      if (resource === "ai") {
        const limit = getLimit("ai.requests_per_month");
        const used = getUsage("aiRequests");
        return used >= limit;
      }
      if (resource === "ocr") {
        const limit = getLimit("ocr.pages_per_month");
        const used = getUsage("ocrPages");
        return used >= limit;
      }
      if (resource === "storage") {
        const limit = getLimit("storage.gb");
        const used = getUsage("usedStorageGB");
        return used >= limit;
      }
      if (resource === "users") {
        const limit = getLimit("users.max");
        const used = getUsage("activeUsers");
        return used >= limit;
      }
      return false;
    },
    [entitlements, getLimit, getUsage]
  );

  return {
    entitlements,
    plan: entitlements?.plan,
    features: entitlements?.features || {},
    limits: entitlements?.limits || {},
    usage: entitlements?.usage || null,
    loading,
    error,
    hasFeature,
    getLimit,
    getUsage,
    isQuotaExceeded,
    refresh: fetchEntitlements,
  };
}
