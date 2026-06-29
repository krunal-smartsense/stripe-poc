import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { CommonHelperService } from '../helpers/commonHelper.service';
import { SubscriptionService } from '../services/subscription.service';
import { validate } from '../middlewares/validate.middleware';

export const createSubscriptionSchema = Joi.object({
  userId: Joi.number().integer().required(),
  stripeCustomerId: Joi.string().trim().required(),
  priceId: Joi.string().trim().required(),
});

export const createSubscriptionValidate = validate(createSubscriptionSchema);

export class SubscriptionController {
  private readonly commonHelperService: CommonHelperService = new CommonHelperService();
  private readonly subscriptionService: SubscriptionService = SubscriptionService.getInstance();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await this.subscriptionService.createSubscription(req.body);
      return this.commonHelperService.sendResponse(res, StatusCodes.CREATED, subscription.toJSON());
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await this.subscriptionService.getSubscriptionById(Number(req.params.id));
      return this.commonHelperService.sendResponse(res, StatusCodes.OK, subscription.toJSON());
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await this.subscriptionService.cancelSubscription(Number(req.params.id));
      return this.commonHelperService.sendResponse(res, StatusCodes.OK, subscription?.toJSON());
    } catch (error) {
      next(error);
    }
  };
}
