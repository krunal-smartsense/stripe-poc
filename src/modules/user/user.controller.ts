import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import { StripeHelperService } from "../../helpers/stripeHelper.service";
import { CommonHelperService } from "../../helpers/commonHelper.service";
import { StatusCodes } from "http-status-codes";
import { User } from "../../database/models/user";
import { Messages } from "../../helpers/messages";
import { AccountUserDbService } from "../../database/services/accountUser.db.service";
import { UserDbService } from "../../database/services/user.db.service";



export class UserController {
    private readonly stripeHelperService: StripeHelperService = StripeHelperService.getInstance();
    private readonly commonHelperService: CommonHelperService = new CommonHelperService();
    private readonly accountUserDbService: AccountUserDbService = AccountUserDbService.getInstance();
    private readonly userDbService: UserDbService = UserDbService.getInstance();

    getProductsFromStripe = async (req: Request, res: Response) => {
        const products = await this.stripeHelperService.getProductList();
        return this.commonHelperService.sendResponse(res, StatusCodes.OK, products)
    }

    subscribeProduct = async (req: Request, res: Response) => {
        const { priceId, quantity = 1 } = req.body;
        const userInfo = req.user;
        const session = await this.stripeHelperService.checkOutSession(userInfo, priceId, quantity);
        return this.commonHelperService.sendResponse(res, StatusCodes.OK, { session })
    }

    inviteUser = async (req: Request, res: Response) => {
        const userInfo = req.user;
        const { role = 'admin' } = req.body;
        if (!userInfo.accountUserInfo) {
            return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.ERR_USER_INVITE)
        }
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email },
        })

        if (user) {
            return this.commonHelperService.sendResponse(res, StatusCodes.CONFLICT, undefined, Messages.USER_EXISTS);
        }
        const hashedPassword = await bcrypt.hash(password, 5);
        const createdUser = await User.create({
            email,
            password: hashedPassword,
        });

        const result = await this.accountUserDbService.addOrUpdateAccountEntry({
            userId: createdUser.id,
            accountId: userInfo.accountUserInfo.accountId,
            permission: role,
        })

        return this.commonHelperService.sendResponse(res, StatusCodes.CREATED, result, Messages.USER_CREATED);

    }

    testSubscription = async (req: Request, res: Response) => {
        const userInfo = req.user;
        const userWithSubscriptionInfo = await this.userDbService.getUserWithSubscription(userInfo.id);
        if (!userWithSubscriptionInfo?.accountUserInfo || !userWithSubscriptionInfo.accountUserInfo?.accountInfo) {
            return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.NO_SUBSCRIPTION);
        }

        const subscriptionId = userWithSubscriptionInfo.accountUserInfo.accountInfo.stripeSubscriptionId as string;
        const subscription = await this.stripeHelperService.getSubscription(subscriptionId);
        console.log("🚀 ~ UserController ~ testSubscription= ~ subscription: %j", subscription)
        if (subscription.status !== 'active') {
            return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.NO_SUBSCRIPTION);
        }
        return this.commonHelperService.sendResponse(res, StatusCodes.OK, undefined, Messages.SUCCESS);
    }

    updateSubscription = async (req: Request, res: Response) => {
        const userInfo = req.user;
        const { subscriptionForUserId, subscriptionId, priceId } = req.body;
        const assignedByUserId = userInfo.id;
        const result = await this.stripeHelperService.updateSubscription(subscriptionId, priceId, subscriptionForUserId, assignedByUserId)
        return this.commonHelperService.sendResponse(res, StatusCodes.OK, undefined, Messages.SUCCESS);
    }
}