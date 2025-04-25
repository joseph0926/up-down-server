import type { Response as InjectResponse } from 'light-my-request';

export const typedJson = <T>(res: InjectResponse) => res.json<T>();
