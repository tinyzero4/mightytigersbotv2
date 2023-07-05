import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
import {
    DynamoDBDocument,
    GetCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { Team } from '@app/domain/team';
import { AWS_REGION, AWS_DYNAMODB_MAIN_TABLE_NAME } from '@app/service/config';
import { Confirmation, Match, MatchStatus, PlayersNames, Squad, WithMe } from '@app/domain/match';
import { ConfirmEvent } from '@app/domain/confirm';
import moment from 'moment/moment';

const marshallOptions = {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
    wrapNumbers: false,
};

const unmarshallOptions = {
    wrapNumbers: false,
};

export class DataRepository {

    private readonly client: DynamoDBDocument;

    constructor() {
        this.client = DynamoDBDocument.from(new DynamoDBClient({
            region: AWS_REGION,
            table: AWS_DYNAMODB_MAIN_TABLE_NAME,
            marshallOptions: {removeUndefinedValues: false, convertClassInstanceToMap: true},
            convertEmptyValues: true
        }), {marshallOptions: marshallOptions, unmarshallOptions});
    }

    async initTeam(team: Team): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(team.id), 'SK': this.generateTeamSK(team.id)},
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

    async updateSchedule(team: Team): Promise<Team> {
        return await this.setTeamSchedule(team.id, team.schedule);
    }

    async setTeamSchedule(teamId: string, schedule: string[]): Promise<Team> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateTeamSK(teamId)},
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

    async getTeam(teamId: string): Promise<Team> {
        const command = new GetCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateTeamSK(teamId)},
        });
        const response = await this.client.send(command);
        return this.responseToTeam(response.Item);
    }

    async initMatch(teamId: string, matchId: string, when: Date): Promise<Match> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateMatchSK(matchId)},
            UpdateExpression: `SET teamId=:teamId, #start=:start, #status=:status, #squad=:squad, #wm=:wm, #players=:players,
            #created=if_not_exists(#created, :created), #version=if_not_exists(#version, :versionDefault) + :versionInc`,
            ExpressionAttributeNames: {
                '#created': 'created',
                '#start': 'start',
                '#status': 'status',
                '#squad': 'squad',
                '#wm': 'wm',
                '#players': 'players',
                '#version': 'version'
            },
            ExpressionAttributeValues: {
                ":teamId": teamId,
                ":start": when.getTime(),
                ":squad": {},
                ":wm": {},
                ":players": {},
                ":status": MatchStatus.SCHEDULED,
                ":created": new Date().getTime(),
                ":versionDefault": 0,
                ":versionInc": 1,
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);
        return this.responseToMatch(response.Attributes);
    }

    async getMatch(teamId: string, matchId: string): Promise<Match> {
        const command = new GetCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateMatchSK(matchId)},
        });
        const response = await this.client.send(command);
        return this.responseToMatch(response.Item);
    }

    async linkMatchDetailsMessage(teamId: string, matchId: string, messageId: string): Promise<boolean> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateMatchSK(matchId)},
            UpdateExpression: `SET #messageId=:messageId`,
            ConditionExpression: `attribute_not_exists(messageId)`,
            ExpressionAttributeNames: {
                "#messageId": "messageId",
            },
            ExpressionAttributeValues: {
                ":messageId": messageId,
            },
            ReturnValues: "ALL_NEW"
        });

        try {
            await this.client.send(command);
            return true;
        } catch (e) {
            return false;
        }
    }

    async confirm(teamId: string, matchId: string, playerId: string, playerName: string, confirmation: string): Promise<Match> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateMatchSK(matchId)},
            UpdateExpression: `SET #squad.#pid=:confirmation, #players.#pid=:playerName`,
            ExpressionAttributeNames: {
                "#squad": "squad",
                "#players": "players",
                "#pid": playerId,
            },
            ExpressionAttributeValues: {
                ":confirmation": {playerId, confirmation, ts: new Date().getTime()} as Confirmation,
                ":playerName": playerName
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);
        return this.responseToMatch(response.Attributes);
    }

    async confirmWithMe(teamId: string, matchId: string, playerId: string, playerName: string, inc: number): Promise<Match> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(teamId), 'SK': this.generateMatchSK(matchId)},
            UpdateExpression: `SET #wm.#pid=if_not_exists(#wm.#pid, :incDefault) + :inc, #squad.#pid.ts=:ts, #players.#pid=:playerName`,
            ExpressionAttributeNames: {
                "#squad": "squad",
                "#players": "players",
                "#wm": "wm",
                "#pid": playerId,
            },
            ExpressionAttributeValues: {
                ":playerName": playerName,
                ":ts": new Date().getTime(),
                ":inc": inc,
                ":incDefault": 0,
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);
        return this.responseToMatch(response.Attributes);
    }

    async trackConfirmEvent(event: ConfirmEvent): Promise<ConfirmEvent> {
        const command = new UpdateCommand({
            TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
            Key: {'PK': this.generatePK(event.teamId), 'SK': this.generateEventSK(event.eventId)},
            UpdateExpression: `SET #expiredAt=:expiredAt, #eventId=:eventId, #data=:data, #version=if_not_exists(#version, :versionDefault) + :versionInc`,
            ExpressionAttributeNames: {
                '#expiredAt': 'expiredAt',
                '#eventId': 'eventId',
                '#data': 'data',
                '#version': 'version',
            },
            ExpressionAttributeValues: {
                ":expiredAt": moment(new Date()).add(2, 'days').toDate().getTime(),
                ":eventId": event.eventId,
                ":data": JSON.stringify(event),
                ":versionDefault": 0,
                ":versionInc": 1,
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await this.client.send(command);
        return this.responseToEvent(response.Attributes);
    }

    private extractId(value: string): string {
        return value.split("#")[1];
    }

    private responseToTeam(attributes?: Record<string, NativeAttributeValue>): Team {
        if (!attributes) throw new Error('Invalid Team definition');
        return new Team(
            this.extractId(attributes?.['PK']),
            attributes?.['name'],
            new Date(attributes?.['created']),
            attributes?.['schedule']
        );
    }

    private responseToMatch(attributes?: Record<string, NativeAttributeValue>): Match {
        if (!attributes) throw new Error('Invalid match definition');
        const attrs = attributes!;

        const teamId = this.extractId(attrs['PK']);
        const matchId = this.extractId(attrs['SK']);
        const start = new Date(attrs['start']);
        const messageId = attrs['messageId'];
        const status = attrs['status'];
        const created = new Date(attrs['created']);
        const version = attrs['version'];
        const squad = (attrs['squad'] || {}) as Squad;
        const withMe = (attrs['wm'] || {}) as WithMe;
        const players = (attrs['players'] || {}) as PlayersNames;

        return new Match(matchId, teamId, start, messageId, squad, withMe, players, status, created, version);
    }

    private responseToEvent(attributes?: Record<string, NativeAttributeValue>): ConfirmEvent {
        if (!attributes) throw new Error('Invalid match definition');
        const attrs = attributes!;

        const data = attrs['data'];
        const version = attrs['version'];

        const event = JSON.parse(data) as ConfirmEvent;
        event.version = version;

        return event;
    }

    private generatePK(teamId: string): string {
        return `TEAM#${teamId}`;
    }

    private generateTeamSK(id: string): string {
        return `DEF#${id}`;
    }

    private generateMatchSK(id: string): string {
        return `MATCH#${id}`;
    }

    private generateEventSK(id: string): string {
        return `EVENT#${id}`;
    }

}
