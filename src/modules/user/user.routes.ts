import express from 'express';
import { UserController } from './user.controller';
import { ValidationHelper } from '../../helpers/validationHelper.service';
// import {  } from './user.validator';
// import { AuthMiddleware } from '../../middlewares/auth.middleware';

const route = express();

class UserRoute {
    // private readonly authMiddleware: AuthMiddleware = new AuthMiddleware()
    private readonly validator: ValidationHelper = new ValidationHelper();
    private readonly userController: UserController = new UserController();
    route = express.Router();
    
    constructor() {
        this.init()
    }
    init() {
        this.route.get('/products', this.userController.getProductsFromStripe)
        this.route.post('/subscribe', this.userController.subscribeProduct);
        this.route.post('/invite-user', this.userController.inviteUser);
        this.route.get('/test-subscription', this.userController.testSubscription);
        this.route.post('/update-subscription', this.userController.updateSubscription);
        this.route.post('/assign-product', this.userController.assignProduct)
    }
}

export const userRoute = new UserRoute().route;