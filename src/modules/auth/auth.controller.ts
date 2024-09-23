import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Messages } from "../../helpers/messages";
import { CommonHelperService } from "../../helpers/commonHelper.service";
import { User } from "../../database/models/user";
import { StatusCodes } from "http-status-codes";

export class AuthController {
    private readonly commonHelper = new CommonHelperService();

    signup = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const user = await User.findOne({
            where: { email }
        })

        if (user) {
            return this.commonHelper.sendResponse(res, StatusCodes.CONFLICT, undefined, Messages.USER_EXISTS);
        }
        const hashedPassword = await bcrypt.hash(password, 5);
        const createdUser = await User.create({
            email,
            password: hashedPassword,
        });
        const token = jwt.sign({ id: createdUser.id }, process.env.SECRET_KEY as string, { expiresIn: process.env.SECRET_KEY_EXPIRES_IN });
        return this.commonHelper.sendResponse(res, StatusCodes.CREATED, { token }, Messages.USER_CREATED);
    }

    login = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({
                where: { email }
            })
            if (!user || !(await bcrypt.compare(password, user.password))) {

                return this.commonHelper.sendResponse(res, StatusCodes.UNAUTHORIZED, undefined, Messages.INVALID_CREDS);
            }
            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY as string, { expiresIn: process.env.SECRET_KEY_EXPIRES_IN });
            return this.commonHelper.sendResponse(res, StatusCodes.OK, { token });
        } catch (error) {
            return this.commonHelper.sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, undefined, Messages.SOMETHING_WENT_WRONG);
        }
    }


}