import { UserSuscribeProducts } from "../models/userSubscribeProducts";

export class UserSubscribeProductDbService {
    static instance: UserSubscribeProductDbService;

    static getInstance() {
        if (!UserSubscribeProductDbService.instance) {
            UserSubscribeProductDbService.instance = new UserSubscribeProductDbService();
        }
        return UserSubscribeProductDbService.instance;
    }
    addOrUpdateUserProductSubscribe = async (payload: any) => {
        const existingSubscription = await UserSuscribeProducts.findOne({
            where: {
                priceId: payload.priceId,
                userId: payload.userId,
            },
        });

        if (!existingSubscription) {
            // Create a new entry if it doesn't exist
            return UserSuscribeProducts.create(payload);
        }
        return existingSubscription; // or return existingSubscription if you want to return it
    };

}