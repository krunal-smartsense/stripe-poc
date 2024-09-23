import express from 'express';
import { authRoute } from '../modules/auth/auth.routes';

import {Logger} from '../helpers/logger.service';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { userRoute } from '../modules/user/user.routes';

const logger = Logger.getInstance();

export class RouteHandler {
    authMiddleware: AuthMiddleware = new AuthMiddleware()
    constructor(app: express.Application) {
        this.init(app)
    }
    
    init(app: express.Application) {
        logger.info("Route initialized")
        app.use('/auth', authRoute);
        app.use('/user', this.authMiddleware.isUserAuthenticated, userRoute)
    }
}