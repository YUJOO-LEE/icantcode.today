export type ApiStatus = 'normal' | 'down' | 'checking';

export interface CanICodeResponse {
  canCode: boolean;
  checkedAt: string;
  statusMessage: string;
}

export interface PostSummaryResponse {
  id: number;
  content: string;
  author: string;
  commentCount: number;
  createdAt: string;
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
