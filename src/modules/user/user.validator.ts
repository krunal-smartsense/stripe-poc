import Joi from 'joi';

export const validateTrialSubscription = Joi.object({
    priceId: Joi.string().trim().required(),
    trialDays: Joi.number().integer().min(1).max(90).default(14),
});
