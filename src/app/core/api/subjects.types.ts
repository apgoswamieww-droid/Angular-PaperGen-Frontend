export type SubjectStatus = 'active' | 'inactive';
export type SubjectSortField = 'name' | 'order' | 'createdAt';
export type SubjectSortDirection = 'asc' | 'desc';

export interface SubjectRecord {
  id: string;
  name: string;
  standardId: string;
  standardName: string;
  mediumId: string;
  mediumName: string;
  order: number;
  status: SubjectStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SubjectsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface SubjectsPage {
  items: SubjectRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: SubjectsSummary;
}

export interface SubjectsQuery {
  search?: string;
  standardId?: string;
  status?: SubjectStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: SubjectSortField;
  dir?: SubjectSortDirection;
}

export interface CreateSubjectRequest {
  name: string;
  standardId: string;
  order: number;
  status?: SubjectStatus;
}

export interface UpdateSubjectRequest {
  name?: string;
  standardId?: string;
  order?: number;
  status?: SubjectStatus;
}
