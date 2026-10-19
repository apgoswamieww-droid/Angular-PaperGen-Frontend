export type MediumStatus = 'active' | 'inactive';
export type MediumSortField = 'name' | 'createdAt';
export type MediumSortDirection = 'asc' | 'desc';

export interface MediumRecord {
  id: string;
  name: string;
  status: MediumStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MediumsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface MediumsPage {
  items: MediumRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: MediumsSummary;
}

export interface MediumsQuery {
  search?: string;
  status?: MediumStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: MediumSortField;
  dir?: MediumSortDirection;
}

export interface CreateMediumRequest {
  name: string;
  status?: MediumStatus;
}

export interface UpdateMediumRequest {
  name?: string;
  status?: MediumStatus;
}
