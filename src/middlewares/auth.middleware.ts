import { NextFunction, Request, Response } from "express";
import * as jwt from 'jsonwebtoken'
import { CommonHelperService } from "../helpers/commonHelper.service";
import { User } from "../database/models/user";
import { Account } from "../database/models/accounts";
import { AccountUser } from "../database/models/accountUser";

export class AuthMiddleware {
    commonHelper: CommonHelperService = new CommonHelperService();;


    isUserAuthenticated = async (req: any, res: Response, next: NextFunction) => {
        try {
            const bearerToken = req.headers.authorization || '';
            const token = bearerToken.split(' ')[1];

            if (token) {
                const tokenData: any = jwt.verify(token, process.env.SECRET_KEY as string)
                if (!tokenData?.id) {
                    return this.commonHelper.sendResponse(res, 401, undefined, 'Unauthorized')
                }
                const user = await User.findOne({
                    where: {
                        id: tokenData.id
                    },
                    include: [
                        {
                           model: AccountUser,
                           required: false,
                           as: 'accountUserInfo',
                        }
                    ]
                })
                console.log("🚀 ~ AuthMiddleware ~ isUserAuthenticated= ~ user:", user?.toJSON())
                if (!user) {
                    return this.commonHelper.sendResponse(res, 401, undefined, 'Unauthorized')
                }
                req.user = user;
                next()
            } else {
                return this.commonHelper.sendResponse(res, 401, undefined, 'Unauthorized')
            }
        } catch (error) {
            console.log("🚀 ~ AuthMiddleware ~ isUserAuthenticated= ~ error:", error)
            return this.commonHelper.sendResponse(res, 401, undefined, 'Unauthorized')

        }


    }
}