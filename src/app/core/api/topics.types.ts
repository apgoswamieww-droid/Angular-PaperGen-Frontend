export type TopicStatus = 'active' | 'inactive';
export type TopicSortField = 'name' | 'order' | 'createdAt';
export type TopicSortDirection = 'asc' | 'desc';

export interface TopicRecord {
  id: string;
  name: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  standardId: string;
  standardName: string;
  mediumId: string;
  mediumName: string;
  order: number;
  status: TopicStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TopicsSummary {
  active: number;
  inactive: number;
  deleted: number;
}

export interface TopicsPage {
  items: TopicRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: TopicsSummary;
}

export interface TopicsQuery {
  search?: string;
  chapterId?: string;
  status?: TopicStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: TopicSortField;
  dir?: TopicSortDirection;
}

export interface CreateTopicRequest {
  name: string;
  chapterId: string;
  order: number;
  status?: TopicStatus;
}

export interface UpdateTopicRequest {
  name?: string;
  chapterId?: string;
  order?: number;
  status?: TopicStatus;
}
