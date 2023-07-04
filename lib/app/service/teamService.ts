import { ulid } from 'ulid';

import { Team } from '@app/domain/team';
import { Match } from '@app/domain/match';
import { DataRepository } from '@app/service/dataRepository';
import { TEAM_SCHEDULE_DEFAULTS } from '@app/service/config';

export class TeamService {

    private readonly repository = new DataRepository();

    async initTeam(teamId: string, teamName: string): Promise<Team> {
        return this.repository.initTeam(new Team(teamId, teamName, new Date(), TEAM_SCHEDULE_DEFAULTS));
    }

    async getTeam(teamId: string): Promise<Team> {
        return this.repository.getTeam(teamId);
    }

    async setTeamSchedule(teamId: string, scheduleValue: string): Promise<Team> {
        const team = await this.getTeam(teamId);
        team.reschedule(scheduleValue);
        await this.repository.updateSchedule(team);
        return team;
    }

    async resolveNextMatch(teamId: string): Promise<Match> {
        const team = await this.repository.getTeam(teamId);
        const when = team.getNextEventDate();
        return await this.repository.initMatch(teamId, when.getTime().toString(), when);
    }

    async linkMatchDetailsMessage(teamId: string, matchId: string, messageId: string): Promise<boolean> {
        return await this.repository.linkMatchDetailsMessage(teamId, matchId, messageId);
    }

}