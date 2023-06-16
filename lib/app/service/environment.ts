import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { AWS_PARAM_BOT_TOKEN, AWS_REGION } from '@app/service/config';

const client = new SSMClient({
    region: AWS_REGION,
});

export class Environment {
    public readonly params: Record<string, string>;

    constructor(params: Record<string, string>) {
        this.params = params;
    }

    public getBotToken(): string {
        return this.params[AWS_PARAM_BOT_TOKEN] || '';
    }
}

async function resolveParameters(names: string[]): Promise<Record<string, string>> {
    try {
        const r = await client.send(new GetParametersCommand({Names: names, WithDecryption: false,}));
        if (!r || !r.Parameters) return {};
        return r.Parameters.map(p => [p.Name || '', p.Value || '']).reduce((acc, c) => ({...acc, [c[0]]: c[1]}), {});
    } catch (e) {
        console.error(e);
        return {};
    }
}

export async function resolveEnvironment(): Promise<Environment> {
    return new Environment(
        await resolveParameters([AWS_PARAM_BOT_TOKEN])
    );
}