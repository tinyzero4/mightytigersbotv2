import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
import {
    DynamoDBDocument,
    GetCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

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
            Key: {'PK': this.toTeamPK(team.id), 'SK': this.toTeamSK(team.id)},
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
        return this.responseToTeam(response.Attributes);
    }

    async reschedule(team: Team): Promise<Team> {
        return await this.setTeamSchedule(team.id, team.schedule);
    }

    async setTeamSchedule(teamId: String, schedule: string[]): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.toTeamPK(teamId), 'SK': this.toTeamSK(teamId)},
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
        return this.responseToTeam(response.Attributes);
    }

    async getTeam(teamId: String): Promise<Team> {
        const command = new GetCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.toTeamPK(teamId), 'SK': this.toTeamSK(teamId)},
        });
        const response = await this.client.send(command);
        return this.responseToTeam(response.Item);
    }

    private responseToTeam(attributes?: Record<string, NativeAttributeValue>): Team {
        if (!attributes) throw new Error('No team definition');
        return new Team(
            attributes?.['PK'],
            attributes?.['name'],
            new Date(attributes?.['created']),
            attributes?.['schedule']
        );
    }

    private toTeamPK(teamId: String): string {
        return `TEAM#${teamId}`;
    }

    private toTeamSK(teamId: String): string {
        return `DEF#${teamId}`;
    }

}
