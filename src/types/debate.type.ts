import { CommentDTO } from './comment.type.js';

export interface DebateSummaryDTO {
  id: string;
  title: string;
  deadline: string;
  proRatio: number;
  conRatio: number;
}

export interface DebateDetailDTO extends DebateSummaryDTO {
  content?: string | null;
  comments: CommentDTO[];
}
