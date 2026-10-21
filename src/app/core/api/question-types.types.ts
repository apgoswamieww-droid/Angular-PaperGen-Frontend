export type QuestionTypeStatus = 'active' | 'inactive';
export type QuestionTypeSortField = 'name' | 'order' | 'createdAt';
export type QuestionTypeSortDirection = 'asc' | 'desc';

export interface QuestionTypeRecord {
  id: string;
  name: string;
  order: number;
  status: QuestionTypeStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionTypesSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface QuestionTypesPage {
  items: QuestionTypeRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: QuestionTypesSummary;
}

export interface QuestionTypesQuery {
  search?: string;
  status?: QuestionTypeStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: QuestionTypeSortField;
  dir?: QuestionTypeSortDirection;
}

export interface CreateQuestionTypeRequest {
  name: string;
  order: number;
  status?: QuestionTypeStatus;
}

export interface UpdateQuestionTypeRequest {
  name?: string;
  order?: number;
  status?: QuestionTypeStatus;
}
