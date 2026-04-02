export interface CustomError extends Error {
  errorCode?: string;
  errors?: { field: string; message: string }[];
}

