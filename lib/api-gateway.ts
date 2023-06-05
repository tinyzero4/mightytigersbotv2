import { Construct } from "constructs";
import { CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Microservices } from './microservices';

export const ApiGatewayEndpointStackOutput = 'ApiEndpoint';
export const ApiGatewayDomainStackOutput = 'ApiDomain';
export const ApiGatewayStageStackOutput = 'ApiStage';

interface ApiGatewayProps {
    microservices: Microservices,
}

const cors = {
    defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
    }
};

export class ApiGateway extends Construct {

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        this.createApiGateway(props);
    }

    private createApiGateway(props: ApiGatewayProps) {
        const apiGateway = new apigateway.RestApi(this, 'ApiGateway', {deployOptions: {tracingEnabled: true,}, ...cors});
        const api = apiGateway.root.addResource('api');

        const health = api.addResource('health');
        health.addMethod('GET', new apigateway.LambdaIntegration(props.microservices.healthHandler));

        const events = api.addResource('events', {...cors});
        events.addMethod('POST', new apigateway.LambdaIntegration(props.microservices.hooksHandler));

        new CfnOutput(this, ApiGatewayEndpointStackOutput, {value: apiGateway.url});
        new CfnOutput(this, ApiGatewayDomainStackOutput, {value: apiGateway.url.split('/')[2]});
        new CfnOutput(this, ApiGatewayStageStackOutput, {value: apiGateway.deploymentStage.stageName});
    }


}