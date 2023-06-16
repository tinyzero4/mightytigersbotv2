import { Construct } from "constructs";
import { CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Microservices } from './microservices';

export const ApiGatewayEndpointStackOutput = 'ApiEndpoint';
export const ApiGatewayDomainStackOutput = 'ApiDomain';
export const ApiGatewayStageStackOutput = 'ApiStage';

interface GatewayProps {
    microservices: Microservices,
}

const cors = {
    defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
    }
};

export class Gateway extends Construct {

    constructor(scope: Construct, id: string, props: GatewayProps) {
        super(scope, id);
        this.createApiGateway(props);
    }

    private createApiGateway(props: GatewayProps) {
        const apiGateway = new apigateway.RestApi(this, 'BotApiGateway', {deployOptions: {tracingEnabled: true,}, ...cors});
        const api = apiGateway.root.addResource('api');

        const health = api.addResource('health');
        health.addMethod('GET', new apigateway.LambdaIntegration(props.microservices.healthHandler));

        const events = api.addResource('events', {...cors});
        events.addMethod('POST', new apigateway.LambdaIntegration(props.microservices.commandsHandler));

        new CfnOutput(this, ApiGatewayEndpointStackOutput, {value: apiGateway.url});
        new CfnOutput(this, ApiGatewayDomainStackOutput, {value: apiGateway.url.split('/')[2]});
        new CfnOutput(this, ApiGatewayStageStackOutput, {value: apiGateway.deploymentStage.stageName});
    }


}