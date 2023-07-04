import * as moment from 'moment';
import * as ejs from 'ejs';

import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Team } from '../app/domain/team';
import { Confirmation, Match, MatchStatus, PlayersNames, Squad, WithMe } from '../app/domain/match';
import {
    AWS_DYNAMODB_MAIN_TABLE_NAME,
    MATCH_CONFIRMATION_TYPE_Y,
    MATCH_CONFIRMATION_TYPE_N,
    MATCH_CONFIRMATION_TYPE_M
} from '../app/service/config';
import { matchDetailsTemplate } from '../app/service/messenger';

const {ulid} = require('ulid');
const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const {DynamoDBDocument, GetCommand, UpdateCommand} = require('@aws-sdk/lib-dynamodb');

const marshallOptions = {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
    wrapNumbers: false,
};

const unmarshallOptions = {
    wrapNumbers: false,
};

const client = DynamoDBDocument.from(new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
    marshallOptions: {removeUndefinedValues: false, convertClassInstanceToMap: true},
    convertEmptyValues: true
}), {marshallOptions: marshallOptions, unmarshallOptions});

async function getTeam(teamId: string): Promise<Team> {
    const command = new GetCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(teamId), 'SK': generateTeamSK(teamId)},
    });
    const response = await client.send(command);
    return responseToTeam(response.Item);
}

async function create(team: Team): Promise<Team> {
    const command = new UpdateCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(team.id), 'SK': generateTeamSK(team.id)},
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
    const response = await client.send(command);
    return responseToTeam(response.Attributes);
}

async function initMatch(match: Match): Promise<Match> {
    const command = new UpdateCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(match.teamId), 'SK': generateMatchSK(match.id)},
        UpdateExpression: `SET teamId=:teamId, messageId=:messageId, #start=:start, #status=:status, #squad=:squad, #wm=:wm, #players=:players,
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
            ":teamId": match.teamId,
            ":messageId": "12333",
            ":start": match.start.getTime(),
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

    const response = await client.send(command);
    return responseToMatch(response.Attributes);
}

async function getMatch(teamId: string, matchId: string): Promise<Match> {
    const command = new GetCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(teamId), 'SK': generateMatchSK(matchId)},
        ConsistentRead: false,
    });
    const response = await client.send(command);
    return responseToMatch(response.Item);
}

type WithMeValue = -1 | 0 | 1
type ConfirmationValue = '⚽' | '🍷' | '🤔'

async function confirm(teamId: string, matchId: string, playerId: string, playerName: string, confirmation: ConfirmationValue): Promise<Match> {
    const command = new UpdateCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(teamId), 'SK': generateMatchSK(matchId)},
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

    const response = await client.send(command);
    return responseToMatch(response.Attributes);
}

async function confirmWithMe(teamId: string, matchId: string, playerId: string, playerName: string, inc: WithMeValue): Promise<Match> {
    const command = new UpdateCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(teamId), 'SK': generateMatchSK(matchId)},
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

    const response = await client.send(command);
    return responseToMatch(response.Attributes);
}

async function linkMessageToMatch(teamId: string, matchId: string, messageId: string): Promise<boolean> {
    const command = new UpdateCommand({
        TableName: AWS_DYNAMODB_MAIN_TABLE_NAME,
        Key: {'PK': generatePK(teamId), 'SK': generateMatchSK(matchId)},
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
        await client.send(command);
        return true;
    } catch (e) {
        return false;
    }
}

function responseToMatch(attributes?: Record<string, NativeAttributeValue>): Match {
    if (!attributes) throw new Error('Invalid match definition');
    const attrs = attributes!;

    const id = extractId(attrs['SK']);
    const teamId = extractId(attrs['PK']);
    const start = new Date(attrs['start']);
    const messageId = attrs['messageId'];
    const status = attrs['status'];
    const created = new Date(attrs['created']);
    const version = attrs['version'];
    const squad = (attrs['squad'] || {}) as Squad;
    const withMe = (attrs['wm'] || {}) as WithMe;
    const players = (attrs['players'] || {}) as PlayersNames;

    return new Match(id, teamId, start, messageId, squad, withMe, players, status, created, version);
}

const extractId = (value: string) => value.split("#")[1];

function responseToTeam(attributes?: Record<string, NativeAttributeValue>): Team {
    if (!attributes) throw new Error('Invalid Team definition');
    return new Team(
        extractId(attributes?.['PK']),
        attributes?.['name'],
        new Date(attributes?.['created']),
        attributes?.['schedule']
    );
}

function generatePK(teamId: string): string {
    return `TEAM#${teamId}`;
}

function generateTeamSK(id: string): string {
    return `DEF#${id}`;
}

function generateMatchSK(id: string): string {
    return `MATCH#${id}`;
}

async function run() {
    const teamId = ulid();
    const matchId = ulid();
    const p1 = `3333`;
    const p2 = `12345`;

    const team = await create(new Team(teamId, 't1', new Date()));
    let match = await initMatch(new Match(matchId, team.id, new Date(), "123", {}, {}));

    await confirm(team.id, match.id, p1, p1, MATCH_CONFIRMATION_TYPE_Y);
    await confirm(team.id, match.id, p2, p2, MATCH_CONFIRMATION_TYPE_N);
    await confirmWithMe(team.id, match.id, p1, p1, 1);
    await confirmWithMe(team.id, match.id, p2, p2, 1);
    await confirmWithMe(team.id, match.id, p2, p2, 1);
    await confirmWithMe(team.id, match.id, p2, p2, 1);
    await confirmWithMe(team.id, match.id, p2, p2, -1);

    await linkMessageToMatch(team.id, match.id, '123');
    await linkMessageToMatch(team.id, match.id, '256');

    console.log(await getTeam(team.id));
    match = await getMatch(team.id, match.id);
    console.log(match);

    const message = ejs.render(matchDetailsTemplate, {...match.getDetails(), moment});
    console.log(message);
}

(async () => {
    await run();
})();
