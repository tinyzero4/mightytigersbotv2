import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { IStringParameter } from 'aws-cdk-lib/aws-ssm/lib/parameter';
import { AWS_PARAM_BOT_TOKEN } from '../app/service/config';

export class Parameters extends Construct {

    public readonly parameters: Record<string, IStringParameter>;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.parameters = {};

        this.parameters[AWS_PARAM_BOT_TOKEN] = new ssm.StringParameter(this, 'alerts-email-param', {
            parameterName: `${AWS_PARAM_BOT_TOKEN}`,
            stringValue: 'TOKEN',
            description: 'Telegram Bot Token',
            tier: ssm.ParameterTier.STANDARD,
            allowedPattern: '.*',
        });
    }
}