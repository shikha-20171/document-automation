export interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
  team?: string;
  department?: string;
  phone?: string;
  avatar?: string;
  activeDocuments?: number;
  completedTasks?: number;
  performanceScore?: string;
}

export interface Team {
  id: string | number;
  name: string;
  description?: string;
  department?: string;
  teamLead?: string;
  membersCount?: number;
  status?: string;
  members?: TeamMember[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  department?: string;
  teamLead?: string;
  status?: string;
}

export interface AssignWorkPayload {
  employeeId: string | number;
  employeeName?: string;
  employeeEmail?: string;
  sendEmail?: boolean;
  type?: "TASK" | "DOCUMENT";
  title: string;
  documentId?: string | number;
  priority?: string;
  instructions?: string;
  dueDate?: string;
}
