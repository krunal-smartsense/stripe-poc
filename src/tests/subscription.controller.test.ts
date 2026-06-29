import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';

jest.mock('../services/subscription.service');

import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController, createSubscriptionValidate } from '../controllers/subscription.controller';
import { NotFoundError, ConflictError } from '../errors/app.error';

const MockedService = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

const mockServiceInstance = {
  createSubscription: jest.fn(),
  getSubscriptionById: jest.fn(),
  cancelSubscription: jest.fn(),
};

function buildApp() {
  (MockedService.getInstance as jest.Mock).mockReturnValue(mockServiceInstance as any);

  const app = express();
  app.use(express.json());

  const controller = new SubscriptionController();
  app.post('/subscriptions', createSubscriptionValidate, controller.create);
  app.get('/subscriptions/:id', controller.getById);
  app.patch('/subscriptions/:id/cancel', controller.cancel);

  // Mirrors the global error handler that would be registered in main.ts
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, code: status, message: err.message });
  });

  return app;
}

describe('SubscriptionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /subscriptions', () => {
    it('returns 201 when a subscription is created successfully', async () => {
      const mockSub = { id: 1, userId: 1, stripeSubscriptionId: 'sub_abc', status: 'active' };
      mockServiceInstance.createSubscription.mockResolvedValue({ toJSON: () => mockSub });

      const res = await request(buildApp())
        .post('/subscriptions')
        .send({ userId: 1, stripeCustomerId: 'cus_123', priceId: 'price_123' });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.data).toEqual(mockSub);
      expect(mockServiceInstance.createSubscription).toHaveBeenCalledWith({
        userId: 1,
        stripeCustomerId: 'cus_123',
        priceId: 'price_123',
      });
    });

    it('returns 400 with Joi error details when request body is invalid', async () => {
      const res = await request(buildApp())
        .post('/subscriptions')
        .send({ userId: 'not-a-number' });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(mockServiceInstance.createSubscription).not.toHaveBeenCalled();
    });

    it('returns 400 when all required fields are missing', async () => {
      const res = await request(buildApp())
        .post('/subscriptions')
        .send({});

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /subscriptions/:id', () => {
    it('returns 200 with the subscription when it exists', async () => {
      const mockSub = { id: 5, status: 'active' };
      mockServiceInstance.getSubscriptionById.mockResolvedValue({ toJSON: () => mockSub });

      const res = await request(buildApp()).get('/subscriptions/5');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toEqual(mockSub);
    });

    it('returns 404 when the subscription does not exist', async () => {
      mockServiceInstance.getSubscriptionById.mockRejectedValue(
        new NotFoundError('Subscription not found'),
      );

      const res = await request(buildApp()).get('/subscriptions/999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe('Subscription not found');
    });
  });

  describe('PATCH /subscriptions/:id/cancel', () => {
    it('returns 200 with the updated subscription on successful cancellation', async () => {
      const mockSub = { id: 1, status: 'cancelled' };
      mockServiceInstance.cancelSubscription.mockResolvedValue({ toJSON: () => mockSub });

      const res = await request(buildApp()).patch('/subscriptions/1/cancel');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toEqual(mockSub);
    });

    it('returns 409 when the subscription is already cancelled', async () => {
      mockServiceInstance.cancelSubscription.mockRejectedValue(
        new ConflictError('Subscription is already cancelled'),
      );

      const res = await request(buildApp()).patch('/subscriptions/1/cancel');

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.message).toBe('Subscription is already cancelled');
    });
  });
});
