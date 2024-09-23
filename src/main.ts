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
import { UserSubscribeProductDbService } from './database/services/userSubscribeProducts.db.service';
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
    const userSubscribeProductDbService = UserSubscribeProductDbService.getInstance();
    // Handle the event
    switch (event.type) {
        //Event when the subscription started
        case 'checkout.session.completed': {
            console.log('New Subscription started!')
            console.log(`================${event.type}==========================`)
            console.log(JSON.stringify(event.data))
            const subscriptionData: Stripe.CheckoutSessionCompletedEvent.Data = event.data;
            const accountEntry = {
                userId: subscriptionData.object?.metadata?.userId,
                stripeSubscriptionId: subscriptionData.object.subscription,
                stripeCustomerId: subscriptionData.object.customer,
                plan: subscriptionData.object?.metadata?.priceId,
                active: true,
            }
            console.log("🚀 ~ app.post ~ accountEntry:", accountEntry)
            const result = await accountsDbService.addOrUpdateAccountEntry(accountEntry);
            const accountUser = {
                userId: subscriptionData.object?.metadata?.userId,
                accountId: result[0]?.id,
                permission: 'owner',
            }
            await accountUserDbService.addOrUpdateAccountEntry(accountUser); 
            const userSubProducts = {
                userId: subscriptionData.object?.metadata?.userId,
                priceId: subscriptionData.object?.metadata?.priceId,
            }
            // await userSubscribeProductDbService.addOrUpdateUserProductSubscribe(userSubProducts);
            break;
        }

        case 'customer.subscription.created':
            console.log('New Subscription Created!')
            // console.log(JSON.stringify(event.data))
            break;

        // Event when the payment is successfull (every subscription interval)  
        case 'invoice.paid':
            console.log('Invoice paid')
            // console.log(event.data)
            break;

        // Event when the payment failed due to card problems or insufficient funds (every subscription interval)  
        case 'invoice.payment_failed':
            console.log('Invoice payment failed!')
            // console.log(event.data)
            break;

        // Event when subscription is updated  
        case 'customer.subscription.updated': {
            console.log('============Subscription updated!==============')
            console.log(JSON.stringify(event.data))
            const subscriptionData: Stripe.CustomerSubscriptionUpdatedEvent.Data = event.data;
            const productInfo = {
                userId: subscriptionData.object?.metadata?.userId,
                priceId: subscriptionData.object?.metadata?.priceId,
            }
            // await userSubscribeProductDbService.addOrUpdateUserProductSubscribe(productInfo);
            break
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