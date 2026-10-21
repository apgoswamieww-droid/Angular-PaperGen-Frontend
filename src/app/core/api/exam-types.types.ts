export type ExamTypeStatus = 'active' | 'inactive';
export type ExamTypeSortField = 'name' | 'order' | 'createdAt';
export type ExamTypeSortDirection = 'asc' | 'desc';

export interface ExamTypeRecord {
  id: string;
  name: string;
  order: number;
  status: ExamTypeStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExamTypesSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface ExamTypesPage {
  items: ExamTypeRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: ExamTypesSummary;
}

export interface ExamTypesQuery {
  search?: string;
  status?: ExamTypeStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: ExamTypeSortField;
  dir?: ExamTypeSortDirection;
}

export interface CreateExamTypeRequest {
  name: string;
  order: number;
  status?: ExamTypeStatus;
}

export interface UpdateExamTypeRequest {
  name?: string;
  order?: number;
  status?: ExamTypeStatus;
}
