const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School admin',
  teacher: 'Teacher',
  staff: 'Staff',
  student: 'Student',
  super_admin: 'Super admin',
  support: 'Support',
};

export function roleLabel(role: string | undefined, fallback: string): string {
  return (role && ROLE_LABELS[role]) || fallback;
}

export function initialsFor(name: string | undefined, fallback: string): string {
  if (!name) {
    return fallback;
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

  return initials || fallback;
}
