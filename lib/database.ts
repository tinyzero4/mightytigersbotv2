import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class Database extends Construct {
    public readonly contentTable: ITable;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.contentTable = this.createContentTable();
    }

    private createContentTable(): ITable {
        return new Table(this, 'mighty-tigers-content-table', {
            partitionKey: {name: 'PK', type: AttributeType.STRING,},
            sortKey: {name: 'SK', type: AttributeType.STRING},
            tableName: 'mightytigers-content',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: 'expiredAt'
        });
    }
}

