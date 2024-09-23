import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config()

const stripe = new Stripe(process.env.STRPE_SECRET_KEY as unknown as string);

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
            expand: ['data.default_price']
        });
        return products;
    }

    public checkOutSession = async (userInfo: any, priceId: string, quantity: number) => {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity,
                }
            ],
            customer_email: userInfo.email,
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                userId: userInfo.id,
                priceId
            },
            subscription_data: {
                metadata: {
                    userId: userInfo.id,
                    priceId
                }
            }
            // cancel_url: `${process.env.BASE_URL}/cancel`
        })
        console.log("🚀 ~ StripeHelperService ~ checkOutSession=async ~ session:", session.url)
        return session.url
    }

    public getSubscription = async (subscriptionId: string) => {
        return stripe.subscriptions.retrieve(
            subscriptionId
        );

    }

    public constructWebhookEvent = async (body: any, sig: string | Buffer | Array<string>) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY as unknown as string;
        return stripe.webhooks.constructEvent(body, sig, webhookSecret);
    }

    public updateSubscription = async (subscriptionId: string, newPriceId: string, userId: number, assignedByUserId: number) => {
        const subscription = await this.getSubscription(subscriptionId);
        const result = await stripe.subscriptions.update(subscriptionId, {
            items: [
                ...subscription.items.data.map(item => ({
                    id: item.id,
                })),
                {
                    price: newPriceId,
                    quantity: 1,                    
                },
            ],
            metadata: {
                priceId: newPriceId,
                isNewProductAdded: 1,
                userId,
                assignedByUserId
            },
            // proration_behavior: 'none',
        });
        return result;
    }
}