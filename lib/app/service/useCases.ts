import { Telegraf } from 'telegraf';
import { Team } from '../domain/team';
import { DataRepository } from '@app/service/dataRepository';
import { TEAM_DEFAULT_SCHEDULE } from '@app/environment/appConfig';

export class UseCases {

    private readonly repository = new DataRepository();

    async initTeam(id: string, name: string): Promise<Team> {
        return this.repository.initTeam({id, name, created: new Date(), schedule: TEAM_DEFAULT_SCHEDULE});
    }

    async onMessage() {
    }

}