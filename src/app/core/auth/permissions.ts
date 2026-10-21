import type { SessionUser } from './auth.types';

export const PERMISSION_AREAS = [
  'users',
  'roles',
  'masters',
  'questions',
  'blueprints',
  'papers',
  'reports',
  'settings',
] as const;

export type PermissionArea = (typeof PERMISSION_AREAS)[number];
export type Permission = `${PermissionArea}.view` | `${PermissionArea}.manage`;

const CONTENT_VIEW_PERMISSIONS: Permission[] = PERMISSION_AREAS.filter(
  (area) => area !== 'users' && area !== 'roles',
).map((area) => `${area}.view` as Permission);

const SYSTEM_ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  school_admin: PERMISSION_AREAS.flatMap((area) => [
    `${area}.view` as Permission,
    `${area}.manage` as Permission,
  ]),
  teacher: [...CONTENT_VIEW_PERMISSIONS, 'questions.manage', 'blueprints.manage', 'papers.manage'],
  staff: [...CONTENT_VIEW_PERMISSIONS, 'users.view'],
  student: ['papers.view'],
};

export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) {
    return false;
  }

  const permissions = user.permissions ?? SYSTEM_ROLE_PERMISSIONS[user.role] ?? [];

  return permissions.includes(permission);
}
