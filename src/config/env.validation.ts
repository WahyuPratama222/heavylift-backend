import * as Joi from 'joi';

export const envValidationSchema = Joi.object({

  PORT: Joi.number().empty('').required(),

  CORS_ORIGIN: Joi.string().required(),

  DATABASE_URL: Joi.string().uri().required(),
  DIRECT_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  XENDIT_SECRET_KEY: Joi.string().required(),
  XENDIT_CALLBACK_TOKEN: Joi.string().required(),

  OWNER_EMAIL: Joi.string().email().optional(),
  OWNER_PASSWORD: Joi.string().optional(),
})
  .unknown(true);