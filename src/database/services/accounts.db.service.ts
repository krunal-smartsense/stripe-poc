import { Account } from "../models/accounts"

// Fields accepted by Account.upsert — id is optional on creation
export type AccountEntryDto = Pick<Account,
  'userId' | 'active' | 'isMainPlan'
> & Partial<Pick<Account, 'name' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'plan'>>;

export class AccountsDbService {
    static getInstance() {
        return new AccountsDbService();
    }

    addOrUpdateAccountEntry = async (payload: AccountEntryDto) => {
        return Account.upsert(payload);
    }

    getAccountInfo = async (subscriptionId: string) => {
        return Account.findOne({
            where: {
                stripeSubscriptionId: subscriptionId
            }
        })
    }
}
