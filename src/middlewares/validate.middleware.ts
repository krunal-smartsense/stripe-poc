import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { Messages } from '../helpers/messages';

export const validate = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: Messages.INVALID_REQUEST,
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
};
