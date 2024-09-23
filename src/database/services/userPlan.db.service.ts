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

}