export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'WORKER' | 'COMPANY_ADMIN' | 'CORPORATE_ADMIN';
  status: 'ACTIVE' | 'DEACTIVATED';
  phoneNumber?: string;
  companyId: string;
  isFirstLogin: boolean;
  createdAt: string;
  lastLoginAt?: string;
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  corporateId: string;
  createdAt: string;
  updatedAt: string;
  corporate?: Corporate;
}

export interface Corporate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  _count?: {
    workerProjects: number;
    timeLogs: number;
  };
}

export interface TimeLog {
  id: string;
  userId: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  totalHours?: number;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDIT_REQUESTED';
  reviewerId?: string;
  reviewedAt?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DashboardStats {
  totalHoursWorked?: number;
  logsApproved?: number;
  logsRejected?: number;
  logsPending?: number;
  thisWeekHours?: number;
  assignedProjects?: number;
  totalWorkers?: number;
  pendingLogs?: number;
  approvedLogs?: number;
  activeProjects?: number;
  totalCompanies?: number;
  totalAdmins?: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Fix for time log filters
export interface TimeLogFilters {
  status?: string;
  projectId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}