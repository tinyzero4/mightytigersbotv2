const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
import { DynamoDBDocument, UpdateCommand, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';

import { Team } from '@app/domain/team';
import { AWS_REGION, AWS_DYNAMODB_MAIN_TABLE_NAME } from '@app/service/config';

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

    async initTeam(team: Team): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': team.id, 'SK': team.id},
            UpdateExpression: "SET #name=:name, #created=if_not_exists(#created, :created), #schedule=:schedule",
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
        return this.responseToTeam(response);
    }

    async setTeamSchedule(teamId: String, schedule: string[]): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': teamId, 'SK': teamId},
            UpdateExpression: "SET #schedule=:schedule",
            ExpressionAttributeNames: {
                '#schedule': 'schedule',
            },
            ExpressionAttributeValues: {
                ":schedule": schedule,
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);
        return this.responseToTeam(response);
    }

    private responseToTeam(response: UpdateCommandOutput): Team {
        return {
            id: response.Attributes?.['PK'],
            name: response.Attributes?.['name'],
            created: new Date(response.Attributes?.['created']),
            schedule: response.Attributes?.['schedule']
        };
    }

}
