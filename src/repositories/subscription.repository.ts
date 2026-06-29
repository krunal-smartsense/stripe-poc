import { Subscription, SubscriptionStatus } from '../models/subscription.model';

interface CreateSubscriptionPayload {
  userId: number;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export class SubscriptionRepository {
  static instance: SubscriptionRepository;

  static getInstance() {
    if (!SubscriptionRepository.instance) {
      SubscriptionRepository.instance = new SubscriptionRepository();
    }
    return SubscriptionRepository.instance;
  }

  findById = async (id: number) => {
    return Subscription.findByPk(id);
  };

  create = async (payload: CreateSubscriptionPayload) => {
    return Subscription.create(payload);
  };

  updateStatus = async (id: number, status: SubscriptionStatus) => {
    return Subscription.update({ status }, { where: { id } });
  };
}
