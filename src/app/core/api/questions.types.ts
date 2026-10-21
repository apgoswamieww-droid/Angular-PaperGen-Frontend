export type QuestionStatus = 'active' | 'inactive';
export type QuestionSortField = 'text' | 'marks' | 'createdAt' | 'updatedAt';
export type QuestionSortDirection = 'asc' | 'desc';

export interface QuestionOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionListItem {
  id: string;
  text: string;
  marks: number;
  status: QuestionStatus;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  standardId: string;
  standardName: string;
  mediumId: string;
  mediumName: string;
  topicId: string | null;
  topicName: string | null;
  questionTypeId: string;
  questionTypeName: string;
  difficultyLevelId: string;
  difficultyLevelName: string;
  bloomLevelId: string | null;
  bloomLevelName: string | null;
  optionCount: number;
  hasAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionRecord extends QuestionListItem {
  options: QuestionOption[];
  answer: string;
  explanation: string;
  source: string;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
}

export interface QuestionsSummary {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export interface QuestionsPage {
  items: QuestionListItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: QuestionsSummary;
}

export interface QuestionsQuery {
  search?: string;
  mediumId?: string;
  standardId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  questionTypeId?: string;
  difficultyLevelId?: string;
  bloomLevelId?: string;
  status?: QuestionStatus | '';
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sort?: QuestionSortField;
  dir?: QuestionSortDirection;
}

export interface QuestionOptionRequest {
  key?: string;
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionRequest {
  text: string;
  chapterId: string;
  topicId?: string | null;
  questionTypeId: string;
  difficultyLevelId: string;
  bloomLevelId?: string | null;
  options?: QuestionOptionRequest[];
  answer?: string;
  explanation?: string;
  source?: string;
  tags?: string[];
  marks: number;
  status?: QuestionStatus;
}

export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;
