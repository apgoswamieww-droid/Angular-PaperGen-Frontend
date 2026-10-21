export type DifficultyLevelStatus = 'active' | 'inactive';
export type DifficultyLevelSortField = 'name' | 'order' | 'createdAt';
export type DifficultyLevelSortDirection = 'asc' | 'desc';

export interface DifficultyLevelRecord {
  id: string;
  name: string;
  order: number;
  status: DifficultyLevelStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DifficultyLevelsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface DifficultyLevelsPage {
  items: DifficultyLevelRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: DifficultyLevelsSummary;
}

export interface DifficultyLevelsQuery {
  search?: string;
  status?: DifficultyLevelStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: DifficultyLevelSortField;
  dir?: DifficultyLevelSortDirection;
}

export interface CreateDifficultyLevelRequest {
  name: string;
  order: number;
  status?: DifficultyLevelStatus;
}

export interface UpdateDifficultyLevelRequest {
  name?: string;
  order?: number;
  status?: DifficultyLevelStatus;
}
