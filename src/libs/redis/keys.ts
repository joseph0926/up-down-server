export const keyViews = (id: string) => `debate:views:${id}`;
export const keyComments = (id: string) => `debate:comments:${id}`;
export const keyVotes = (id: string) => `debate:votes:${id}`;
export const keyParticipants = (id: string) => `debate:participants:${id}`;
export const keySideLikes = (debateId: string) => `debate:sideLikes:${debateId}`;
export const keyTopSide = (debateId: string, side: 'PRO' | 'CON') =>
  `debate:top:${side.toLowerCase()}:${debateId}`;
