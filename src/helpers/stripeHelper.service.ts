import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRPE_SECRET_KEY as string);

// Minimum user fields required to create a Stripe checkout session
export interface CheckoutUserDto {
  id: number;
  email: string;
}

export class StripeHelperService {
  static instance: StripeHelperService;

  static getInstance() {
    if (!StripeHelperService.instance) {
      StripeHelperService.instance = new StripeHelperService();
    }
    return StripeHelperService.instance;
  }

  public getProductList = async () => {
    const products = await stripe.products.list({
      limit: 10,
      expand: ['data.default_price'],
    });
    return products;
  };

  public checkOutSession = async (
    // Typed DTO instead of any — only id and email are consumed here
    userInfo: CheckoutUserDto,
    priceId: string,
    quantity: number,
  ) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity }],
      customer_email: userInfo.email,
      success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { userId: userInfo.id, priceId },
      subscription_data: { metadata: { userId: userInfo.id, priceId } },
    });
    console.log('🚀 ~ StripeHelperService ~ checkOutSession=async ~ session:', session.url);
    return session.url;
  };

  public getSubscription = async (subscriptionId: string): Promise<Stripe.Subscription> => {
    return stripe.subscriptions.retrieve(subscriptionId);
  };

  // Raw body must be Buffer or string for Stripe's signature verification to work
  public constructWebhookEvent = async (
    body: Buffer | string,
    sig: string | Buffer | string[],
  ): Promise<Stripe.Event> => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY as string;
    return stripe.webhooks.constructEvent(body, sig, webhookSecret);
  };

  public updateSubscription = async (
    subscriptionId: string,
    newPriceId: string,
    quantity: number,
    userId: number,
  ) => {
    const subscription = await this.getSubscription(subscriptionId);

    const existingItem = subscription.items.data.find(
      (item) => item.price.id === newPriceId,
    );

    let updatedItems: Stripe.SubscriptionUpdateParams.Item[];
    if (existingItem) {
      updatedItems = subscription.items.data.map((item) => {
        if (item.plan.id === existingItem.plan.id) {
          return { id: item.id, quantity: quantity || 1 };
        }
        return { id: item.id };
      });
    } else {
      updatedItems = [
        ...subscription.items.data.map((item) => ({ id: item.id })),
        { price: newPriceId, quantity: 1 },
      ];
    }

    return stripe.subscriptions.update(subscriptionId, {
      items: updatedItems,
      metadata: {
        priceId: newPriceId,
        isQuantityUpdated: existingItem ? 1 : 0,
        isNewProductAdded: existingItem ? 0 : 1,
        userId,
      },
    });
  };
}
