export type StandardStatus = 'active' | 'inactive';
export type StandardSortField = 'name' | 'order' | 'createdAt';
export type StandardSortDirection = 'asc' | 'desc';

export interface StandardRecord {
  id: string;
  name: string;
  mediumId: string;
  mediumName: string;
  order: number;
  status: StandardStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StandardsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface StandardsPage {
  items: StandardRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: StandardsSummary;
}

export interface StandardsQuery {
  search?: string;
  mediumId?: string;
  status?: StandardStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: StandardSortField;
  dir?: StandardSortDirection;
}

export interface CreateStandardRequest {
  name: string;
  mediumId: string;
  order: number;
  status?: StandardStatus;
}

export interface UpdateStandardRequest {
  name?: string;
  mediumId?: string;
  order?: number;
  status?: StandardStatus;
}
