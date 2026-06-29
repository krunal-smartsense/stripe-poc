import express, { Request } from 'express';
import { RouteHandler } from './routes';
import * as dotenv from 'dotenv';
// import logger from './helpers/logger.service';
import { Logger } from './helpers/logger.service';

import { CommonHelperService } from './helpers/commonHelper.service';
import { Messages } from './helpers/messages';
import { sequelize } from './database/models';
import { StripeHelperService } from './helpers/stripeHelper.service';
import Stripe from 'stripe';
import { AccountsDbService } from './database/services/accounts.db.service';
import { StatusCodes } from 'http-status-codes';
import { AccountUserDbService } from './database/services/accountUser.db.service';
import { UserPlansDbService } from './database/services/userPlan.db.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone); 

dotenv.config()

const port = process.env.PORT || 3002;
const logger = Logger.getInstance();
const commonHelperService = new CommonHelperService();

const app = express();

app.use(express.urlencoded({ extended: true }))


app.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        return res.status(400).send(`Webhook Error:`);
    }
    const stripeHelperService: StripeHelperService = new StripeHelperService()
    let event;

    try {
        event = await stripeHelperService.constructWebhookEvent(req.body, sig)
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err}`);
    }
    const accountsDbService = AccountsDbService.getInstance();
    const accountUserDbService = AccountUserDbService.getInstance();
    const userPlansDbService = UserPlansDbService.getInstance();
    // Handle the event
    console.log("🚀 ~ app.post ~ event.type:", event.type)
    switch (event.type) {
        //Event when the subscription started
        case 'checkout.session.completed': {
            // console.log('New Subscription started!')
            // console.log(`================${event.type}==========================`)
            // console.log(JSON.stringify(event.data))
            const subscriptionData: Stripe.CheckoutSessionCompletedEvent.Data = event.data;
            const accountEntry = {
                userId: subscriptionData.object?.metadata?.userId,
                stripeSubscriptionId: subscriptionData.object.subscription,
                stripeCustomerId: subscriptionData.object.customer,
                plan: subscriptionData.object?.metadata?.priceId,
                active: true,
            }
            // console.log("🚀 ~ app.post ~ accountEntry:", accountEntry)
            const result = await accountsDbService.addOrUpdateAccountEntry(accountEntry);
            const accountUser = {
                userId: subscriptionData.object?.metadata?.userId,
                accountId: result[0]?.id,
                permission: 'owner',
            }
            await accountUserDbService.addOrUpdateAccountEntry(accountUser); 
            break;
        }

        case 'customer.subscription.created':
            // console.log('New Subscription Created!')
            const subscriptionData: Stripe.CustomerSubscriptionCreatedEvent.Data = event.data;

            const accountEntry = {
                userId: subscriptionData.object?.metadata?.userId,
                stripeSubscriptionId: subscriptionData.object.id,
                stripeCustomerId: subscriptionData.object.customer,
                plan: subscriptionData.object?.metadata?.priceId,
                isMainPlan: true,
            }
            // console.log("🚀 ~ app.post ~ accountEntry:", accountEntry)
            const result = await accountsDbService.addOrUpdateAccountEntry(accountEntry);
            // console.log(JSON.stringify(event.data))
            break;

        // Reactivate account when a payment succeeds (covers reinstatement after failed payment)
        case 'invoice.paid': {
            const invoiceData: Stripe.InvoicePaidEvent.Data = event.data;
            const subscriptionId = invoiceData.object.subscription as string;
            if (subscriptionId) {
                await accountsDbService.setAccountActive(subscriptionId, true);
            }
            break;
        }

        // Suspend account access when payment fails
        case 'invoice.payment_failed': {
            const invoiceData: Stripe.InvoicePaymentFailedEvent.Data = event.data;
            const subscriptionId = invoiceData.object.subscription as string;
            if (subscriptionId) {
                await accountsDbService.setAccountActive(subscriptionId, false);
            }
            break;
        }

        // Handle plan upgrades, downgrades, and quantity changes
        case 'customer.subscription.updated': {
            const subscriptionData: Stripe.CustomerSubscriptionUpdatedEvent.Data = event.data;
            const subscription = subscriptionData.object;
            const accountInfo = await accountsDbService.getAccountInfo(subscription.id);

            if (!accountInfo) break;

            // Keep Account.plan in sync with the first subscription item's price
            const primaryPriceId = subscription.items.data[0]?.price?.id;
            if (primaryPriceId) {
                await accountsDbService.updateAccountPlan(subscription.id, primaryPriceId);
            }

            // Revoke excess seats for any item whose quantity was reduced
            for (const item of subscription.items.data) {
                const currentQuantity = item.quantity ?? 0;
                await userPlansDbService.revokeExcessSeats(accountInfo.id, item.price.id, currentQuantity);
            }

            break;
        }

        // Deactivate account when subscription is cancelled
        case 'customer.subscription.deleted': {
            const subscriptionData: Stripe.CustomerSubscriptionDeletedEvent.Data = event.data;
            const subscriptionId = subscriptionData.object.id;
            await accountsDbService.setAccountActive(subscriptionId, false);
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return res.send();
});

app.use(express.json());
new RouteHandler(app);


app.get('/health', async (req, res) => {
    const commonHelper = new CommonHelperService();
    try {
        // const result = await prisma.$queryRawUnsafe(`SELECT 1+1`);
        await sequelize.authenticate();
        logger.info('Connection has been established successfully.');
        return commonHelper.sendResponse(res, 200, undefined, 'Server is healthy');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        return commonHelper.sendResponse(res, 500, undefined, Messages.SOMETHING_WENT_WRONG);
    }
})
app.get('/success', async (req, res) => {
    //const session = await stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['subscription', 'subscription.plan.product'] })

    res.send('Subscribed successfully')
})
app.get('/subsctiption-active', (req, res) => {
    return commonHelperService.sendResponse(res, StatusCodes.OK, undefined, 'Subscription already exists')
})
app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
})