import { AccountUser } from "../models/accountUser";

// Required fields to create an account-user join record
export type AddAccountUserDto = Pick<AccountUser, 'accountId' | 'userId' | 'permission' | 'onboarded'>;

export class AccountUserDbService {
    static instance: AccountUserDbService;

    static getInstance() {
        if (!AccountUserDbService.instance) {
            AccountUserDbService.instance = new AccountUserDbService();
        }
        return AccountUserDbService.instance;
    }

    addOrUpdateAccountEntry = async (payload: AddAccountUserDto) => {
        return AccountUser.create(payload)
    }
}
