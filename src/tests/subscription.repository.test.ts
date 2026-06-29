import { SubscriptionRepository } from '../repositories/subscription.repository';
import { Subscription } from '../models/subscription.model';

jest.mock('../models/subscription.model', () => ({
  Subscription: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Cast required: jest.Mocked doesn't know the model is also a ModelStatic at compile time
const MockSubscription = Subscription as jest.Mocked<typeof Subscription>;

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;

  beforeEach(() => {
    repository = SubscriptionRepository.getInstance();
  });

  describe('findById', () => {
    it('returns null when no subscription exists for the given id', async () => {
      MockSubscription.findByPk.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
      expect(MockSubscription.findByPk).toHaveBeenCalledWith('999');
    });

    it('returns the subscription when it exists', async () => {
      const mockSub = { id: 1, userId: 1, status: 'active', planId: 'price_123' };
      MockSubscription.findByPk.mockResolvedValue(mockSub as unknown as Subscription);

      const result = await repository.findById('1');

      expect(result).toEqual(mockSub);
    });

    it('propagates database errors', async () => {
      MockSubscription.findByPk.mockRejectedValue(new Error('DB connection lost'));

      await expect(repository.findById('1')).rejects.toThrow('DB connection lost');
    });
  });

  describe('create', () => {
    it('persists and returns the new subscription record', async () => {
      const payload = {
        userId: 1,
        stripeSubscriptionId: 'sub_abc123',
        status: 'active' as const,
        planId: 'price_123',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
      };
      const created = { id: 42, ...payload };
      MockSubscription.create.mockResolvedValue(created as unknown as Subscription);

      const result = await repository.create(payload);

      expect(MockSubscription.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(created);
    });

    it('propagates database errors', async () => {
      MockSubscription.create.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(
        repository.create({
          userId: 1,
          stripeSubscriptionId: 'sub_dup',
          status: 'active',
          planId: 'price_123',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        }),
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('updateStatus', () => {
    it('updates only the status field for the given subscription id', async () => {
      MockSubscription.update.mockResolvedValue([1] as unknown as [number]);

      await repository.updateStatus('1', { status: 'cancelled' });

      expect(MockSubscription.update).toHaveBeenCalledWith(
        { status: 'cancelled' },
        { where: { id: '1' } },
      );
    });

    it('does not include extra fields in the update payload', async () => {
      MockSubscription.update.mockResolvedValue([1] as unknown as [number]);

      await repository.updateStatus('5', { status: 'past_due' });

      const [updatePayload] = MockSubscription.update.mock.calls[0];
      expect(Object.keys(updatePayload)).toEqual(['status']);
    });

    it('propagates database errors', async () => {
      MockSubscription.update.mockRejectedValue(new Error('Deadlock detected'));

      await expect(repository.updateStatus('1', { status: 'cancelled' })).rejects.toThrow('Deadlock detected');
    });
  });

  describe('findAll (inherited from BaseRepository)', () => {
    it('returns all subscriptions when called without a where clause', async () => {
      const mockSubs = [{ id: 1, status: 'active' }, { id: 2, status: 'trialing' }];
      MockSubscription.findAll.mockResolvedValue(mockSubs as unknown as Subscription[]);

      const result = await repository.findAll();

      expect(MockSubscription.findAll).toHaveBeenCalledWith({ where: undefined });
      expect(result).toEqual(mockSubs);
    });

    it('passes the where clause through to the model', async () => {
      MockSubscription.findAll.mockResolvedValue([]);

      await repository.findAll({ status: 'cancelled' });

      expect(MockSubscription.findAll).toHaveBeenCalledWith({ where: { status: 'cancelled' } });
    });
  });

  describe('delete (inherited from BaseRepository)', () => {
    it('destroys the record with the given id and returns the count', async () => {
      MockSubscription.destroy.mockResolvedValue(1);

      const result = await repository.delete('3');

      expect(MockSubscription.destroy).toHaveBeenCalledWith({ where: { id: '3' } });
      expect(result).toBe(1);
    });

    it('propagates database errors', async () => {
      MockSubscription.destroy.mockRejectedValue(new Error('FK constraint'));

      await expect(repository.delete('1')).rejects.toThrow('FK constraint');
    });
  });
});
