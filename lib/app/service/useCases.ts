import { Telegraf } from 'telegraf';
import { Team } from '../domain/team';
import { DataRepository } from '@app/service/dataRepository';

export class UseCases {

    private readonly repository = new DataRepository();

    async initTeam(id: string, name: string): Promise<Team> {
        const team = this.repository.initTeam({id, name, created: new Date()})
        return team;
    }

    async onMessage() {
    }

}