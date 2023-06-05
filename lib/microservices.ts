import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Aws } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejsfunction from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

interface MicroserviceProps {
    contentTable: ITable;
}

export class Microservices extends Construct {
    public readonly hooksHandler: NodejsFunction;
    public readonly healthHandler: NodejsFunction;

    constructor(scope: Construct, id: string, props: MicroserviceProps) {
        super(scope, id);
        this.hooksHandler = this.createHooksFunction(props);
        this.healthHandler = this.createHealthFunction(props);
    }

    private createHooksFunction(props: MicroserviceProps): NodejsFunction {
        const func = this.createFunction(this, 'hooks', props.contentTable);
        props.contentTable.grantReadWriteData(func);
        return func;
    }

    private createHealthFunction(props: MicroserviceProps): NodejsFunction {
        return this.createFunction(this, 'health', props.contentTable);
    }

    private createFunction(scope: Construct, name: string, ddb: ITable, allowedOrigins?: string) {
        return new nodejsfunction.NodejsFunction(scope, name, {
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: path.join(__dirname, `./lambda/${name}.ts`),
            handler: 'lambdaHandler',
            bundling: {
                externalModules: [
                    'aws-sdk',
                    '@aws-lambda-powertools/commons',
                    '@aws-lambda-powertools/logger',
                    '@aws-lambda-powertools/metrics',
                    '@aws-lambda-powertools/tracer',
                ],
            },
            environment: {
                DDB_TABLE: ddb.tableName,
                ALLOWED_ORIGINS: allowedOrigins || '*',
                POWERTOOLS_SERVICE_NAME: name,
                POWERTOOLS_METRICS_NAMESPACE: 'mightytigersbot',
            },
            layers: [
                lambda.LayerVersion.fromLayerVersionArn(
                    scope,
                    `PowertoolsLayer-${name}`,
                    `arn:aws:lambda:${Aws.REGION}:094274105915:layer:AWSLambdaPowertoolsTypeScript:11`,
                )
            ],
            tracing: lambda.Tracing.ACTIVE,
        });
    }
}