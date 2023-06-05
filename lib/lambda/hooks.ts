import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';
import { ApiResponse } from './api-response';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

const handler = async (event: APIGatewayEvent, context?: Context): Promise<APIGatewayProxyResult> => {
    try {
        return new ApiResponse(200, {});
    } catch (error) {
        return new ApiResponse(500, {message: (error as Error).message});
    }
};

export const lambdaHandler = middy(handler)
    .use(injectLambdaContext(logger, {logEvent: true}))
    .use(captureLambdaHandler(tracer, {captureResponse: true}))
    .use(logMetrics(metrics, {captureColdStartMetric: true}));