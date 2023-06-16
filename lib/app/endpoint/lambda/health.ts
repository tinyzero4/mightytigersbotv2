import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { APIResponse } from './common';
import { VERSION } from '../../service/config';

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        return new APIResponse(200, {version: VERSION});
    } catch (error) {
        return new APIResponse(500, {message: (error as Error).message});
    }
};