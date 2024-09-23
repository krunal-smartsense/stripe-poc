import { Account } from "../models/accounts";
import { AccountUser } from "../models/accountUser";
import { User } from "../models/user";

export class UserDbService {
    static instance: UserDbService;

    static getInstance() {
        if (!UserDbService.instance) {
            UserDbService.instance = new UserDbService();
        }
        return UserDbService.instance;
    }
    addOrUpdateUser = async (payload: any) => {
        return User.upsert(payload)
    }

    getUserWithSubscription = async (userId: number) => {
        return User.findByPk(userId, {
            include: [
                {
                    model: AccountUser,
                    required: false,
                    as: 'accountUserInfo',
                    include: [
                        {
                            model: Account,
                            required: false,
                            as: 'accountInfo',
                        }
                    ]
                },
               
            ]
        })
    }
}