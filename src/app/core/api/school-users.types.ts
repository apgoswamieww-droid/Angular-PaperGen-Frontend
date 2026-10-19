export type SchoolUserRole = 'school_admin' | 'teacher' | 'staff' | 'student';
export type SchoolUserStatus = 'active' | 'suspended';
export type SchoolUserSortField = 'name' | 'createdAt';
export type SchoolUserSortDirection = 'asc' | 'desc';

export interface SchoolUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SchoolUserRole;
  status: SchoolUserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SchoolUsersSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  schoolAdmins: number;
  teachers: number;
  staff: number;
  students: number;
}

export interface SchoolUsersPage {
  items: SchoolUserRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: SchoolUsersSummary;
}

export interface SchoolUsersQuery {
  search?: string;
  role?: SchoolUserRole | '';
  status?: SchoolUserStatus | '';
  page?: number;
  pageSize?: number;
  sort?: SchoolUserSortField;
  dir?: SchoolUserSortDirection;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  role: SchoolUserRole;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: SchoolUserRole;
}

export interface GeneratedCredentials {
  email: string;
  password: string;
  sent: boolean;
}

export interface CreateUserResult {
  user: SchoolUserRecord;
  credentials: GeneratedCredentials;
}
