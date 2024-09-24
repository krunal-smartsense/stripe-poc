import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import { StripeHelperService } from "../../helpers/stripeHelper.service";
import { CommonHelperService } from "../../helpers/commonHelper.service";
import { StatusCodes } from "http-status-codes";
import { User } from "../../database/models/user";
import { Messages } from "../../helpers/messages";
import { AccountUserDbService } from "../../database/services/accountUser.db.service";
import { UserDbService } from "../../database/services/user.db.service";
import { UserPlans } from "../../database/models/userPlans";
import { UserPlansDbService } from "../../database/services/userPlan.db.service";



export class UserController {
    private readonly stripeHelperService: StripeHelperService = StripeHelperService.getInstance();
    private readonly commonHelperService: CommonHelperService = new CommonHelperService();
    private readonly accountUserDbService: AccountUserDbService = AccountUserDbService.getInstance();
    private readonly userDbService: UserDbService = UserDbService.getInstance();
    private readonly userPlansDbService: UserPlansDbService = UserPlansDbService.getInstance();

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
        const { subscriptionId, priceId, quantity } = req.body;
        const assignedByUserId = userInfo.id;
        await this.stripeHelperService.updateSubscription(subscriptionId, priceId, quantity, userInfo.id)
        return this.commonHelperService.sendResponse(res, StatusCodes.OK, undefined, Messages.SUCCESS);
    }

    assignProduct = async(req: Request, res: Response) => {
        try {
            const { id: currentUserId, accountUserInfo } = req.user;
            const { priceId, assignedTo } = req.body;

            // Check user permissions
            if (!['admin', 'owner'].includes(accountUserInfo?.permission)) {
                return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.ERR_ROLE);
            }

            // Get user with subscription info
            const userWithSubscription = await this.userDbService.getUserWithSubscription(currentUserId);
            if (!userWithSubscription?.accountUserInfo?.accountInfo) {
                return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.NO_SUBSCRIPTION);
            }

            const { accountId, accountInfo } = userWithSubscription.accountUserInfo;
            const subscriptionId = accountInfo.stripeSubscriptionId as string;

            // Check subscription status
            const subscription = await this.stripeHelperService.getSubscription(subscriptionId);
            if (subscription.status !== 'active') {
                return this.commonHelperService.sendResponse(res, StatusCodes.FORBIDDEN, undefined, Messages.ERR_SUBSCRIPTION);
            }

            // Check if product exists in subscription
            const item = subscription.items.data.find(item => item.price.id === priceId);
            if (!item) {
                return this.commonHelperService.sendResponse(res, StatusCodes.NOT_FOUND, undefined, Messages.PRODUCT_NOT_FOUND);
            }

            // Check available quantity
            const totalQuantity = item.quantity || 1;
            const assignedQuantity = await this.userPlansDbService.getAllotedQuantityCount(accountId, priceId);
            if (assignedQuantity >= totalQuantity) {
                return this.commonHelperService.sendResponse(res, StatusCodes.BAD_REQUEST, undefined, Messages.NO_MORE_QUANTITY);
            }

            // Check if product is already assigned to the user
            const isProductAssigned = await this.userPlansDbService.checkProductAssigned(accountId, priceId, assignedTo);
            if (isProductAssigned) {
                return this.commonHelperService.sendResponse(res, StatusCodes.BAD_REQUEST, undefined, Messages.PRODUCT_ALREADY_ASSIGNED);
            }

            // Assign the product
            await this.userPlansDbService.assignProduct({
                assignedByUserId: currentUserId,
                priceId,
                accountId,
                userId: assignedTo,
            });

            return this.commonHelperService.sendResponse(res, StatusCodes.OK, undefined, Messages.SUCCESS);
        } catch (error) {
            console.error('Error in assignProduct:', error);
            return this.commonHelperService.sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, undefined, Messages.SOMETHING_WENT_WRONG);
        }
    }
}