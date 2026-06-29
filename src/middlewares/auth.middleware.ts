import { NextFunction, Request, Response } from "express";
import * as jwt from 'jsonwebtoken'
import { CommonHelperService } from "../helpers/commonHelper.service";
import { User } from "../database/models/user";
import { AccountUser } from "../database/models/accountUser";

// Shape of the decoded JWT payload — only `id` is required by this middleware
interface JwtTokenPayload {
    id: number;
}

export class AuthMiddleware {
    commonHelper: CommonHelperService = new CommonHelperService();

    isUserAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bearerToken = req.headers.authorization || '';
            const token = bearerToken.split(' ')[1];

            if (token) {
                // jwt.verify returns `JwtPayload | string`; cast to the known shape
                const tokenData = jwt.verify(token, process.env.SECRET_KEY as string) as JwtTokenPayload;
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
