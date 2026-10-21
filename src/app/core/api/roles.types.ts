import type { Permission, PermissionArea } from '../auth/permissions';

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  area: PermissionArea;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}

export type RoleSortField = 'name' | 'createdAt';
export type RoleSortDirection = 'asc' | 'desc';
export type RoleAuditAction = 'created' | 'updated' | 'deleted';

export interface RoleRecord {
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RolesSummary {
  total: number;
  system: number;
  custom: number;
  assignedUsers: number;
}

export interface RolesPage {
  items: RoleRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: RolesSummary;
  catalog: PermissionGroup[];
}

export interface RoleOption {
  key: string;
  name: string;
  isSystem: boolean;
}

export interface RoleAuditSnapshot {
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleAuditRecord {
  id: string;
  roleKey: string;
  roleName: string;
  action: RoleAuditAction;
  actorName: string;
  actorEmail: string;
  before: RoleAuditSnapshot | null;
  after: RoleAuditSnapshot | null;
  createdAt: string;
}

export interface RoleAuditPage {
  items: RoleAuditRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RolesQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: RoleSortField;
  dir?: RoleSortDirection;
}

export interface RoleAuditQuery {
  page?: number;
  pageSize?: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}
