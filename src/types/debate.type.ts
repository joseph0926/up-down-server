import { CommentDTO } from './comment.type.js';

export interface DebateSummaryDTO {
  id: string;
  title: string;
  deadline: string;
  proCount: number;
  conCount: number;
}

export interface DebateDetailDTO extends DebateSummaryDTO {
  content?: string | null;
  comments: CommentDTO[];
}
