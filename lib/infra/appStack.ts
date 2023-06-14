import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from './database';
import { Microservices } from './microservices';
import { ApiGateway } from './apiGateway';
import { Parameters } from './parameters';

export class AppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const database = new Database(this, 'Database');
        const parameters = new Parameters(this, 'Parameters');
        const microservices = new Microservices(this, 'Microservices', {
            contentTable: database.contentTable,
            parameters: parameters.parameters
        });
        const apigateway = new ApiGateway(this, 'ApiGateway', {microservices});
    }
}
