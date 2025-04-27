/**
 * 토론 열기(Hot) 지수
 * ────────────────────────────────────────────
 *  score = log10(views + 1)
 *        + 2 × comments
 *        + 1 × participants
 *        – hoursSinceStart / 12
 *
 *  • views         : 조회수(1만 ↑ → 로그 스케일링)
 *  • comments      : 댓글 수(가장 강한 가중치·실제 참여)
 *  • participants  : 중복 없는 참가자 수(IP·닉네임 해시)
 *  • startAt       : 토론 시작 시각(신선도 감쇠)
 *
 */
export interface HotScoreInput {
  views: number;
  comments: number;
  participants: number;
  startAt: number | Date;
}

export function calcHotScore({ views, comments, participants, startAt }: HotScoreInput): number {
  const v = Math.log10(views + 1);
  const c = 2 * comments;
  const p = participants;
  const hrs = (Date.now() - (startAt instanceof Date ? startAt.getTime() : startAt)) / 3.6e6;

  return v + c + p - hrs / 12;
}
