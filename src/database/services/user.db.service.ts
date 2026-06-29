import { Account } from "../models/accounts";
import { AccountUser } from "../models/accountUser";
import { User } from "../models/user";

// Only email and password are required; id is assigned by the DB on insert
export type UpsertUserDto = Pick<User, 'email' | 'password'> & Partial<Pick<User, 'id'>>;

export class UserDbService {
    static instance: UserDbService;

    static getInstance() {
        if (!UserDbService.instance) {
            UserDbService.instance = new UserDbService();
        }
        return UserDbService.instance;
    }

    addOrUpdateUser = async (payload: UpsertUserDto) => {
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
