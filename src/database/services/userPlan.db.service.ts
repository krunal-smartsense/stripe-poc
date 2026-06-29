import { UserPlans } from "../models/userPlans";

export class UserPlansDbService {
    static instance: UserPlansDbService;

    static getInstance() {
        if (!UserPlansDbService.instance) {
            UserPlansDbService.instance = new UserPlansDbService();
        }
        return UserPlansDbService.instance;
    }
    addOrUpdateUserProductSubscribe = async (payload: any) => {
        const existingSubscription = await UserPlans.findOne({
            where: {
                priceId: payload.priceId,
                userId: payload.userId,
            },
        });

        if (!existingSubscription) {
            // Create a new entry if it doesn't exist
            return UserPlans.create(payload);
        }
        return existingSubscription; // or return existingSubscription if you want to return it
    };

    getAllotedQuantityCount(accountId: number, priceId: string) {
        return UserPlans.count({
            where: {
                priceId,
                accountId,
            }
        })
    }

    checkProductAssigned(accountId: number, priceId: string, userId: number) {
        return UserPlans.findOne({
            where: {
                priceId,
                accountId,
                userId,
            }
        })
    }

    assignProduct(payload: any) {
        return UserPlans.create(payload)
    }

    revokeExcessSeats = async (accountId: number, priceId: string, keepCount: number) => {
        const plans = await UserPlans.findAll({
            where: { accountId, priceId },
            order: [['createdAt', 'ASC']],
        });
        const toRevoke = plans.slice(keepCount);
        await Promise.all(toRevoke.map(plan => plan.destroy()));
        return toRevoke.length;
    }
}