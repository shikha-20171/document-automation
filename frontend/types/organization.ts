export interface OrganisationBranch {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  status: "active" | "inactive";
  user_count?: number;
}

export interface OrganisationAdmin {
  id: string;
  organisation_id: string;
  organisation_name: string;
  branch?: string;
  admin_name: string;
  full_name: string;
  email: string;
  city?: string;
  branch_name?: string;
  role: "ORGANIZATION_ADMIN" | string;
  status: "active" | "inactive" | "pending";
  created_at: string;
  last_login?: string;
}

export interface Organisation {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  logo_url?: string;
  status: "active" | "suspended" | "deactivated" | "pending";
  subscription_plan: "Enterprise" | "Business" | "Professional" | "Starter" | string;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  admins?: OrganisationAdmin[];
  branches?: OrganisationBranch[];
  stats?: {
    total_users: number;
    total_branches: number;
    total_departments: number;
    total_teams: number;
    storage_used_gb: number;
    max_storage_gb: number;
    ai_requests: number;
    ai_credits_limit: number;
  };
}

export interface CreateOrganisationData {
  name: string;
  code?: string;
  admin_name: string;
  admin_email: string;
  password?: string;
  subscription_plan?: "Enterprise" | "Business" | "Professional" | "Starter" | string;
  status?: "active" | "pending";
  send_email?: boolean;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export interface CreateOrganisationAdminData {
  organisation_id: string | number;
  admin_name: string;
  admin_email: string;
  city?: string;
  password?: string;
  status: "active" | "inactive";
  send_email?: boolean;
}

export interface OrganisationFilters {
  search?: string;
  status?: string;
  subscription?: string;
  page?: number;
  limit?: number;
  organisation_id?: string | number;
}
