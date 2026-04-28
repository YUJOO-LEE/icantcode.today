export type ApiStatus = 'normal' | 'down' | 'checking';

export interface ModelStatus {
  model: string;
  status: string;
  responseTimeMs: number;
}

export type StatusPageIndicator = 'none' | 'minor' | 'major' | 'critical' | 'maintenance';

export type StatusPageComponentStatus =
  | 'operational'
  | 'degraded_performance'
  | 'partial_outage'
  | 'major_outage'
  | 'under_maintenance';

export interface StatusPageComponent {
  name: string;
  status: StatusPageComponentStatus;
}

export interface StatusPage {
  indicator: StatusPageIndicator;
  description?: string;
  message?: string | null;
  components: StatusPageComponent[];
}

export interface CanICodeResponse {
  canCode: boolean;
  checkedAt: string;
  statusMessage: string;
  models: ModelStatus[];
  statusPage?: StatusPage;
}

export interface PostSummaryResponse {
  id: number;
  content: string;
  author: string;
  commentCount: number;
  createdAt: string;
}

export interface PostListResponse {
  list: PostSummaryResponse[];
  totalCount: number;
}

export interface CreatePostRequest {
  content: string;
  author: string;
  userCode: string;
}

export interface CommentResponse {
  id: number;
  postId: number;
  content: string;
  author: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
  author: string;
  userCode: string;
}

export interface IdResponse {
  id: number;
}
