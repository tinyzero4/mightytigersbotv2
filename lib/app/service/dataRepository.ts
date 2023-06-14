import { Team } from '../domain/team';

const {ulid} = require('ulid');
const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
import { AWS_REGION, AWS_DYNAMODB_MAIN_TABLE_NAME } from '@app/environment/appConfig';
import { DynamoDBDocument, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export class DataRepository {

    private readonly client: DynamoDBDocument;

    constructor() {
        this.client = DynamoDBDocument.from(new DynamoDBClient({
            region: AWS_REGION,
            table: AWS_DYNAMODB_MAIN_TABLE_NAME,
            marshallOptions: {removeUndefinedValues: false},
            convertEmptyValues: true
        }));
    }

    public async initTeam(team: Team): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': team.id, 'SK': team.id},
            UpdateExpression: "SET #name=:name, #created=:created, #schedule=:schedule",
            ExpressionAttributeNames: {
                '#name': 'name',
                '#schedule': 'schedule',
                '#created': 'created',
            },
            ExpressionAttributeValues: {
                ":name": team.name,
                ":schedule": team.schedule || [],
                ":created": (team.created || new Date()).getTime()
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);

        return {
            id: response.Attributes?.['PK'],
            name: response.Attributes?.['name'],
            created: new Date(response.Attributes?.['created']),
            schedule: response.Attributes?.['schedule']
        };
    }

    public async findTeam(id: string): Promise<Team | undefined> {
        return {} as Team;
    }
}
