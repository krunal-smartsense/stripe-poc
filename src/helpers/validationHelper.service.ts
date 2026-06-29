import { NextFunction, Request, Response } from 'express';
import { Messages } from './messages';
// ValidationErrorItem is the per-field error shape Joi produces; no need for any
import { ObjectSchema, ValidationErrorItem } from 'joi';

export class ValidationHelper {
  // ObjectSchema without a generic defaults to unknown, which is correct here
  public validateBody(validator: ObjectSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = await validator.validate(req.body, { abortEarly: false });
      if (error) {
        const errorMessage = error.details.map((err: ValidationErrorItem) => ({
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          code: 400,
          message: Messages.INVALID_REQUEST,
        });
      }
      req.body = value;
      next();
    };
  }

  // ObjectSchema instead of any — Joi's schema type is parameterised but the
  // params shape is unknown at this level of abstraction
  public validateParams(validator: ObjectSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = await validator.validate(req.params, { abortEarly: false });
      if (error) {
        const errorMessages = error.details.map((err: ValidationErrorItem) => ({
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          code: 400,
          message: Messages.INVALID_REQUEST,
        });
      }
      req.params = value;
      next();
    };
  }
}
