import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { SubscriptionStatus } from '../models/subscription.model';
import { NotFoundError, ConflictError } from '../errors/app.error';

dotenv.config();

const stripe = new Stripe(process.env.STRPE_SECRET_KEY as string);

interface CreateSubscriptionPayload {
  userId: number;
  stripeCustomerId: string;
  priceId: string;
}

export class SubscriptionService {
  static instance: SubscriptionService;
  private readonly subscriptionRepository: SubscriptionRepository = SubscriptionRepository.getInstance();

  static getInstance() {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  createSubscription = async (payload: CreateSubscriptionPayload) => {
    const { userId, stripeCustomerId, priceId } = payload;

    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
    });

    return this.subscriptionRepository.create({
      userId,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status as SubscriptionStatus,
      planId: priceId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });
  };

  getSubscriptionById = async (id: number) => {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    return subscription;
  };

  cancelSubscription = async (id: number) => {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    if (subscription.status === 'cancelled') {
      throw new ConflictError('Subscription is already cancelled');
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    await this.subscriptionRepository.updateStatus(id, 'cancelled');
    return this.subscriptionRepository.findById(id);
  };
}
