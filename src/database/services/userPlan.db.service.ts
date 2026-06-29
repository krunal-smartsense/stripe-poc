import { UserPlans } from "../models/userPlans";

// Fields needed to create or look up a user-plan assignment
export type UserPlanDto = Pick<UserPlans, 'userId' | 'assignedByUserId'> & {
    accountId: number;
    priceId: string;
};

export class UserPlansDbService {
    static instance: UserPlansDbService;

    static getInstance() {
        if (!UserPlansDbService.instance) {
            UserPlansDbService.instance = new UserPlansDbService();
        }
        return UserPlansDbService.instance;
    }

    addOrUpdateUserProductSubscribe = async (payload: UserPlanDto) => {
        const existingSubscription = await UserPlans.findOne({
            where: {
                priceId: payload.priceId,
                userId: payload.userId,
            },
        });

        if (!existingSubscription) {
            return UserPlans.create(payload);
        }
        return existingSubscription;
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

    // Assign a product directly without a dedup check
    assignProduct(payload: UserPlanDto) {
        return UserPlans.create(payload)
    }
}
