export type ChapterStatus = 'active' | 'inactive';
export type ChapterReferenceType = 'ncert' | 'other';
export type ChapterSortField = 'name' | 'order' | 'createdAt';
export type ChapterSortDirection = 'asc' | 'desc';

export interface ChapterRecord {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  standardId: string;
  standardName: string;
  mediumId: string;
  mediumName: string;
  referenceType: ChapterReferenceType;
  order: number;
  status: ChapterStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ChaptersSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface ChaptersPage {
  items: ChapterRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: ChaptersSummary;
}

export interface ChaptersQuery {
  search?: string;
  subjectId?: string;
  referenceType?: ChapterReferenceType | '';
  status?: ChapterStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: ChapterSortField;
  dir?: ChapterSortDirection;
}

export interface CreateChapterRequest {
  name: string;
  subjectId: string;
  referenceType: ChapterReferenceType;
  order: number;
  status?: ChapterStatus;
}

export interface UpdateChapterRequest {
  name?: string;
  subjectId?: string;
  referenceType?: ChapterReferenceType;
  order?: number;
  status?: ChapterStatus;
}
