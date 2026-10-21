export type TenantType = 'school' | 'institute';
export type TenantStatus = 'active' | 'suspended';
export type TenantBoard = 'cbse' | 'icse' | 'state' | 'ib' | 'other';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';

export interface AdminSchoolBilling {
  billingCycle: BillingCycle;
  subscriptionStatus: SubscriptionStatus;
  renewalAt: string | null;
  trialEndsAt: string | null;
  priceOverride: number | null;
}

export interface AdminSchoolSummary extends AdminSchoolBilling {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  city: string;
  plan: string;
  planName: string;
  status: TenantStatus;
  brandColor: string;
  userCount: number;
  createdAt: string;
}

export interface AdminSchoolDetail extends AdminSchoolBilling {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  plan: string;
  planName: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  phone: string;
  email: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  tagline: string;
  brandColor: string;
  logo: string;
  board: string;
  affiliationNumber: string;
  principalName: string;
  academicYear: string;
  timezone: string;
}

export interface AdminSchoolStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  pendingSetupUsers: number;
  activeSessions: number;
  pendingInvites: number;
  schoolAdmins: number;
  teachers: number;
  staff: number;
  students: number;
  lastLoginAt: string | null;
}

export interface AdminSchoolUser {
  id: string;
  name: string;
  email: string;
  role: 'school_admin' | 'teacher' | 'staff' | 'student';
  status: string;
  setupPending: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSchoolDetailResult {
  school: AdminSchoolDetail;
  stats: AdminSchoolStats;
  recentUsers: AdminSchoolUser[];
}

export interface CreateSchoolRequest {
  name: string;
  type: TenantType;
  city?: string;
  plan: string;
  adminName: string;
  adminEmail: string;
}

export interface CreateSchoolResult {
  school: AdminSchoolSummary;
  invite: {
    email: string;
    expiresInHours: number;
    sent: boolean;
  };
}

export interface UpdateSchoolRequest {
  name?: string;
  slug?: string;
  type?: TenantType;
  plan?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  pincode?: string;
  country?: string;
  tagline?: string;
  brandColor?: string;
  logo?: string;
  board?: TenantBoard | '';
  affiliationNumber?: string;
  principalName?: string;
  academicYear?: string;
  timezone?: string;
}

export interface UpdateSchoolBillingRequest {
  plan?: string;
  billingCycle?: BillingCycle;
  subscriptionStatus?: SubscriptionStatus;
  renewalAt?: string | null;
  trialEndsAt?: string | null;
  priceOverride?: number | null;
}

export interface ResendInviteResult {
  email: string;
  expiresInHours: number;
  sent: boolean;
}

export interface MasterSeedCount {
  created: number;
  reused: number;
}

export interface MasterSeedResult {
  schoolId: string;
  mediums: MasterSeedCount;
  standards: MasterSeedCount;
  subjects: MasterSeedCount;
  chapters: MasterSeedCount;
  topics: MasterSeedCount;
  durationMs: number;
}

export type ResetPasswordSendResult =
  | { kind: 'reset'; email: string; sent: boolean; expiresInMinutes: number }
  | { kind: 'invite'; email: string; sent: boolean; expiresInHours: number };
