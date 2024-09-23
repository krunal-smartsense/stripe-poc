import Joi from 'joi';

export const validateLogin = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(4).required()
})

export const validateChangePassword =  Joi.object({
    currentPassword: Joi.string().trim().min(4).required(),
    newPassword: Joi.string().trim().min(4).required()
})

export const validateForgotPassword = Joi.object({
    email: Joi.string().trim().email().required(),
})

export const validateResetPassword = Joi.object({
    email: Joi.string().trim().email().required(),
    otp: Joi.string().trim().length(6).required(),
    newPassword: Joi.string().trim().min(4).required()
})