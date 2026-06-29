// mock* variables are hoisted alongside jest.mock() by Jest's transformer
const mockStripeCreate = jest.fn();
const mockStripeCancel = jest.fn();

jest.mock('stripe', () => {
  return jest.fn(() => ({
    subscriptions: {
      create: mockStripeCreate,
      cancel: mockStripeCancel,
    },
  }));
});

jest.mock('../repositories/subscription.repository');

import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { NotFoundError, ConflictError } from '../errors/app.error';

const MockRepository = SubscriptionRepository as jest.MockedClass<typeof SubscriptionRepository>;

const mockRepoInstance = {
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    (MockRepository.getInstance as jest.Mock).mockReturnValue(mockRepoInstance);
    service = new SubscriptionService();
  });

  describe('createSubscription', () => {
    it('calls stripe.subscriptions.create with the correct customer and price', async () => {
      const stripeResponse = {
        id: 'sub_abc',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1702592000,
      };
      mockStripeCreate.mockResolvedValue(stripeResponse);
      mockRepoInstance.create.mockResolvedValue({
        id: 1,
        stripeSubscriptionId: stripeResponse.id,
        status: stripeResponse.status,
      });

      await service.createSubscription({
        userId: 7,
        stripeCustomerId: 'cus_test',
        priceId: 'price_xyz',
      });

      expect(mockStripeCreate).toHaveBeenCalledWith({
        customer: 'cus_test',
        items: [{ price: 'price_xyz' }],
      });
    });

    it('persists the subscription with data mapped from the Stripe response', async () => {
      const stripeResponse = {
        id: 'sub_abc',
        status: 'trialing',
        current_period_start: 1700000000,
        current_period_end: 1702592000,
      };
      mockStripeCreate.mockResolvedValue(stripeResponse);
      mockRepoInstance.create.mockResolvedValue({});

      await service.createSubscription({
        userId: 7,
        stripeCustomerId: 'cus_test',
        priceId: 'price_xyz',
      });

      expect(mockRepoInstance.create).toHaveBeenCalledWith({
        userId: 7,
        stripeSubscriptionId: 'sub_abc',
        status: 'trialing',
        planId: 'price_xyz',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702592000 * 1000),
      });
    });

    it('propagates a Stripe error when the API call fails', async () => {
      mockStripeCreate.mockRejectedValue(new Error('Your card was declined'));

      await expect(
        service.createSubscription({
          userId: 7,
          stripeCustomerId: 'cus_test',
          priceId: 'price_xyz',
        }),
      ).rejects.toThrow('Your card was declined');

      expect(mockRepoInstance.create).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriptionById', () => {
    it('returns the subscription when it exists', async () => {
      const mockSub = { id: 1, status: 'active' };
      mockRepoInstance.findById.mockResolvedValue(mockSub);

      const result = await service.getSubscriptionById(1);

      expect(result).toEqual(mockSub);
    });

    it('throws NotFoundError when the repository returns null', async () => {
      mockRepoInstance.findById.mockResolvedValue(null);

      await expect(service.getSubscriptionById(999)).rejects.toThrow(NotFoundError);
      await expect(service.getSubscriptionById(999)).rejects.toMatchObject({
        message: 'Subscription not found',
        statusCode: 404,
      });
    });
  });

  describe('cancelSubscription', () => {
    it('calls stripe cancel and updates status for an active subscription', async () => {
      const activeSub = { id: 1, status: 'active', stripeSubscriptionId: 'sub_abc' };
      const cancelledSub = { id: 1, status: 'cancelled', stripeSubscriptionId: 'sub_abc' };
      mockRepoInstance.findById
        .mockResolvedValueOnce(activeSub)
        .mockResolvedValueOnce(cancelledSub);
      mockStripeCancel.mockResolvedValue({ id: 'sub_abc', status: 'canceled' });
      mockRepoInstance.updateStatus.mockResolvedValue([1]);

      const result = await service.cancelSubscription(1);

      expect(mockStripeCancel).toHaveBeenCalledWith('sub_abc');
      expect(mockRepoInstance.updateStatus).toHaveBeenCalledWith('1', { status: 'cancelled' });
      expect(result).toEqual(cancelledSub);
    });

    it('throws NotFoundError when the subscription does not exist', async () => {
      mockRepoInstance.findById.mockResolvedValue(null);

      await expect(service.cancelSubscription(999)).rejects.toThrow(NotFoundError);
      await expect(service.cancelSubscription(999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws ConflictError and does not call Stripe when subscription is already cancelled', async () => {
      mockRepoInstance.findById.mockResolvedValue({
        id: 1,
        status: 'cancelled',
        stripeSubscriptionId: 'sub_abc',
      });

      await expect(service.cancelSubscription(1)).rejects.toThrow(ConflictError);
      await expect(service.cancelSubscription(1)).rejects.toMatchObject({
        message: 'Subscription is already cancelled',
        statusCode: 409,
      });
      expect(mockStripeCancel).not.toHaveBeenCalled();
    });
  });
});
