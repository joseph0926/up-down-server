export interface ApiSuccess<T> {
  message: string;
  success: true;
  data: T;
}

export type ApiErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL';

export interface ApiError {
  success: false;
  code: ApiErrorCode;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
