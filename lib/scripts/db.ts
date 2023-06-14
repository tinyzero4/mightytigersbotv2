import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Team } from '../app/domain/team';

const {ulid} = require('ulid');
const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const {DynamoDBDocument, QueryCommand, GetCommand, PutCommand, UpdateCommand} = require('@aws-sdk/lib-dynamodb');

const table = "mightytigers-data";

const client = DynamoDBDocument.from(new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    table: table,
    marshallOptions: {removeUndefinedValues: false},
    convertEmptyValues: true
}));

async function find(pk: string, sk: string): Promise<Record<string, NativeAttributeValue>[]> {
    const command = new QueryCommand({
        TableName: table,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
        ExpressionAttributeNames: {'#pk': 'PK', '#sk': 'SK'},
        ExpressionAttributeValues: {':pk': pk, ':sk': sk},
    });

    return (await client.send(command)).Items || [];
}

async function get(id: string): Promise<Record<string, NativeAttributeValue> | undefined> {
    const command = new GetCommand({
        TableName: table,
        Key: {pk: id, sk: id},
        ConsistentRead: false,
    });
    return (await client.send(command)).Item;
}

async function create(team: Team): Promise<Team> {
    const command = new UpdateCommand({
        TableName: table,
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
            ":created": team.created.getTime()
        },
        ReturnValues: "ALL_NEW"
    });
    const response = await client.send(command);
    return {
        id: response.Attributes['PK'],
        name: response.Attributes['name'],
        created: new Date(response.Attributes['created']),
        schedule: response.Attributes['schedule']
    };
}

async function run() {
    const team: Team = {id: ulid(), name: 't1', created: new Date()};
    const r1 = await create(team);
    console.log(`r1=${JSON.stringify(r1)}`);
    const response = await find(team.id, team.id);
    console.log(response);
}

(async () => {
    await run();
})();
