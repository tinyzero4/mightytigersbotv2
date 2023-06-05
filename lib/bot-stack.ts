import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from './database';
import { Microservices } from './microservices';
import { ApiGateway } from './api-gateway';

export class BotStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const database = new Database(this, 'Database');
        const microservices = new Microservices(this, 'Microservices', {contentTable: database.contentTable});
        const apigateway = new ApiGateway(this, 'ApiGateway', {microservices});
    }
}
