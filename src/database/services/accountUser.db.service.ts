import { Account } from "../models/accounts"
import { AccountUser } from "../models/accountUser";

export class AccountUserDbService {
    static instance: AccountUserDbService;

    static getInstance() {
        if (!AccountUserDbService.instance) {
            AccountUserDbService.instance = new AccountUserDbService();
        }
        return AccountUserDbService.instance;
    }
    addOrUpdateAccountEntry = async(payload: any) => {
        return AccountUser.create(payload)
    }
}