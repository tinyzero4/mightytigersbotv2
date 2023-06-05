import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ApiResponse } from './api-response';

const healthCheckHandler = async (event: APIGatewayEvent, context?: Context): Promise<APIGatewayProxyResult> => {
    try {
        return new ApiResponse(200, {});
    } catch (error) {
        return new ApiResponse(500, {message: (error as Error).message});
    }
};

export const lambdaHandler = healthCheckHandler;