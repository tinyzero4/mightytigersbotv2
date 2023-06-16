import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';
import { APIResponse } from './common';
import { CommandHandler } from '@app/service/commandHandler';
import { resolveEnvironment } from '@app/service/environment';
import * as console from 'console';

const toolsConfig = {namespace: 'bot', serviceName: 'mightytigers'};
const logger = new Logger(toolsConfig);
const tracer = new Tracer(toolsConfig);
const metrics = new Metrics(toolsConfig);

let commandsHandler: CommandHandler;

const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        if (!commandsHandler) commandsHandler = new CommandHandler(await resolveEnvironment());

        context.callbackWaitsForEmptyEventLoop = false;
        if (event.body) {
            await commandsHandler.handle(event.body);
            return new APIResponse(200, {});
        } else {
            return new APIResponse(400, {message: "no command"});
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`[command] issue ${error} ${error?.stack}`);
        } else {
            console.error(`[command] issue ${error}`);
        }
        return new APIResponse(500, {message: (error as Error).message});
    }
};

export const lambdaHandler = middy(handler)
    .use(injectLambdaContext(logger, {logEvent: true}))
    .use(captureLambdaHandler(tracer, {captureResponse: true}))
    .use(logMetrics(metrics, {captureColdStartMetric: true}));