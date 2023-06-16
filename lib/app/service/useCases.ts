import { Team } from '@app/domain/team';
import { DataRepository } from '@app/service/repository';
import { TEAM_SCHEDULE_DEFAULTS, TEAM_SCHEDULE_PATTERN } from '@app/service/config';

export class UseCases {

    private readonly repository = new DataRepository();

    async initTeam(teamId: string, teamName: string): Promise<Team> {
        return this.repository.initTeam({
            id: teamId,
            name: teamName,
            created: new Date(),
            schedule: TEAM_SCHEDULE_DEFAULTS
        });
    }

    async setTeamSchedule(teamId: string, scheduleValue: string): Promise<Team> {
        const schedule = this.parseSchedule(scheduleValue);
        const team = await this.repository.setTeamSchedule(teamId, schedule);
        await this.cleanObsoleteMatches(team);
        return team;
    }

    private async cleanObsoleteMatches(team: Team) {
        // await matchService.cancelObsoleteMatches(team.team_id);
    }

    private parseSchedule(scheduleValue: string): string[] {
        const schedule = scheduleValue.split(",");
        if (!schedule.length || schedule.some(s => !s.match(TEAM_SCHEDULE_PATTERN))) {
            throw Error('Invalid schedule definition. Should be `WEEK_DAY@HH:MM,`');
        }
        return schedule;
    }

    async getTeamSeasonStats(teamId: String) {
    }

    async getNextMatch(teamId: String) {
    }

    async processMatchConfirmation(teamId: string) {
    }

    async inspectMessage() {
    }

}