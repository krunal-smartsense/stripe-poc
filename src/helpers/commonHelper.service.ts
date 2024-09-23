import {Logger} from './logger.service';
const logger = Logger.getInstance();

export class CommonHelperService {
    sendResponse(res: any, statusCode: number, data: object[] | object = [], message: string = '') {
        const objResponse = {
            success: true,
            code: statusCode || 200,
        };

        Object.assign(objResponse, {
            ...objResponse,
            data,
        });

        if (message.length > 0) {
            Object.assign(objResponse, {
                ...objResponse,
                message,
            });
        }
        return res.status(statusCode).json(objResponse);
    }
}