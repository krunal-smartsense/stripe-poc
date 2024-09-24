import { NextFunction, Request, Response } from "express";
import { Messages } from "./messages";
import { ObjectSchema } from "joi";

export class ValidationHelper {
    public validateBody(validator: ObjectSchema<any>) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const { error, value } = await validator.validate(req.body, { abortEarly: false });
            if (error) {
                const errorMessage = error.details.map((err: any) => ({
                    message: err.message,
                }));

                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: Messages.INVALID_REQUEST,
                })
            }
            req.body = value;
            next();
        }
    }

    public validateParams(validator: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const { error, value } = await validator.validate(req.params, { abortEarly: false });
            if (error) {
                const errorMessages = error.details.map((err: any) => ({
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