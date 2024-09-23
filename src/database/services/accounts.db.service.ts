import { Account } from "../models/accounts"

export class AccountsDbService {
    static getInstance() {
        return new AccountsDbService();
    }
    addOrUpdateAccountEntry = async(payload: any) => {
        return Account.upsert(payload);
    }

    getAccountInfo = async(subscriptionId: string) => {
        return Account.findOne({
            where: {
                stripeSubscriptionId: subscriptionId
            }
        })
    }
}