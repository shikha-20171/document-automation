export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  department?: string;
  team?: string;
  status?: "active" | "inactive" | "pending" | string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  team?: string;
  role?: string;
  bio?: string;
  avatar?: string;
  date?: string;
  preferences?: Record<string, any>;
  sessions?: Array<{ id: string; device: string; ip: string; lastActive: string; current?: boolean }>;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  team?: string;
}

export interface InviteUserPayload {
  name?: string;
  email: string;
  role: string;
  department?: string;
  team?: string;
  phone?: string;
}
