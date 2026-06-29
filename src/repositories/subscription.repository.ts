import { WhereOptions, Attributes } from 'sequelize';
import { BaseRepository } from './base.repository';
import { Subscription, SubscriptionAttributes } from '../models/subscription.model';

export class SubscriptionRepository extends BaseRepository<Subscription> {
  private static instance: SubscriptionRepository;

  constructor() {
    super(Subscription);
  }

  static getInstance(): SubscriptionRepository {
    if (!SubscriptionRepository.instance) {
      SubscriptionRepository.instance = new SubscriptionRepository();
    }
    return SubscriptionRepository.instance;
  }

  // Accept status and/or currentPeriodEnd so a single method serves both cancel and renewal flows
  updateStatus(
    id: string,
    data: Partial<Pick<SubscriptionAttributes, 'status' | 'currentPeriodEnd'>>,
  ): Promise<[number]> {
    return this.model.update(
      data,
      { where: { id } as WhereOptions<Attributes<Subscription>> },
    );
  }
}
