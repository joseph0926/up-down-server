import { ApiError, ApiErrorCode, ApiSuccess } from '../../types/common.type.js';

export const ok = <T>(data: T, message = ''): ApiSuccess<T> => {
  return { success: true, data, message };
};

export const fail = (code: ApiErrorCode, message: string): ApiError => {
  return { success: false, code, message };
};
