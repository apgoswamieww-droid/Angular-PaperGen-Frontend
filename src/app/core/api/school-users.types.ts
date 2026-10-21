export type SchoolUserRole = string;
export type SchoolUserStatus = 'active' | 'suspended';
export type SchoolUserSortField = 'name' | 'createdAt';
export type SchoolUserSortDirection = 'asc' | 'desc';
export type StudentGender = 'male' | 'female' | 'other';
export type StudentStream = 'science' | 'arts' | 'commerce' | 'none';
export type ScienceGroup = 'a' | 'b' | 'ab';

export interface StudentProfileRecord {
  surname: string;
  firstName: string;
  lastName: string;
  grNumber: string;
  rollNumber: string;
  fatherFullName: string;
  motherFullName: string;
  gender: StudentGender | null;
  dateOfBirth: string | null;
  address: string;
  mobile: string;
  whatsappNumber: string;
  stream: StudentStream | null;
  scienceGroup: ScienceGroup | null;
  subjectIds: string[];
  aadhaarNumber: string;
  mediumId: string | null;
  standardId: string | null;
}

export interface StudentProfileRequest {
  surname?: string;
  firstName?: string;
  lastName?: string;
  grNumber?: string;
  rollNumber?: string;
  fatherFullName?: string;
  motherFullName?: string;
  gender?: StudentGender | '';
  dateOfBirth?: string;
  address?: string;
  mobile?: string;
  whatsappNumber?: string;
  stream?: StudentStream | '';
  scienceGroup?: ScienceGroup | '';
  subjectIds?: string[];
  aadhaarNumber?: string;
  mediumId?: string;
  standardId?: string;
}

export interface SchoolUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SchoolUserRole;
  studentProfile: StudentProfileRecord | null;
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
  role?: string;
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
  studentProfile?: StudentProfileRequest;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: SchoolUserRole;
  studentProfile?: StudentProfileRequest;
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

export interface StudentImportRowResult {
  row: number;
  name: string;
  email: string;
  status: 'created' | 'failed';
  error: string | null;
  password: string | null;
}

export interface StudentImportResult {
  total: number;
  created: number;
  failed: number;
  results: StudentImportRowResult[];
}
