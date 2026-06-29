import { Response } from 'express';
import { Logger } from './logger.service';

const logger = Logger.getInstance();

// Canonical envelope shape for every JSON response from this API
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  data?: T;
  message?: string;
}

export class CommonHelperService {
  // Generic so callers get compile-time safety on the data shape they're returning
  sendResponse<T>(
    res: Response,
    statusCode: number,
    data?: T,
    message?: string,
  ): Response {
    const body: ApiResponse<T> = { success: true, code: statusCode };
    if (data !== undefined) body.data = data;
    if (message && message.length > 0) body.message = message;
    return res.status(statusCode).json(body);
  }
}
