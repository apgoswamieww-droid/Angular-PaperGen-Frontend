export type BloomLevelStatus = 'active' | 'inactive';
export type BloomLevelSortField = 'name' | 'order' | 'createdAt';
export type BloomLevelSortDirection = 'asc' | 'desc';

export interface BloomLevelRecord {
  id: string;
  name: string;
  order: number;
  status: BloomLevelStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BloomLevelsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface BloomLevelsPage {
  items: BloomLevelRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: BloomLevelsSummary;
}

export interface BloomLevelsQuery {
  search?: string;
  status?: BloomLevelStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: BloomLevelSortField;
  dir?: BloomLevelSortDirection;
}

export interface CreateBloomLevelRequest {
  name: string;
  order: number;
  status?: BloomLevelStatus;
}

export interface UpdateBloomLevelRequest {
  name?: string;
  order?: number;
  status?: BloomLevelStatus;
}
