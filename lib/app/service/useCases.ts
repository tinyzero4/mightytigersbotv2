import { Team } from '@app/domain/team';
import { DataRepository } from '@app/service/repository';
import { TEAM_SCHEDULE_DEFAULTS, TEAM_SCHEDULE_PATTERN } from '@app/service/config';

export class UseCases {

    private readonly repository = new DataRepository();

    async initTeam(teamId: string, teamName: string): Promise<Team> {
        return this.repository.initTeam(new Team(teamId, teamName, new Date(), TEAM_SCHEDULE_DEFAULTS));
    }

    async setTeamSchedule(teamId: string, scheduleValue: string): Promise<Team> {
        const team = await this.repository.getTeam(teamId);
        team.reschedule(scheduleValue)

        await this.repository.reschedule(team);
        await this.onNewSchedule(team);

        return team;
    }

    private async onNewSchedule(team: Team) {
        // await matchService.cancelObsoleteMatches(team.team_id);
    }

    private parseSchedule(scheduleValue: string): string[] {
        const schedule = scheduleValue.substring(scheduleValue.lastIndexOf(" ")).trim().split(",");
        if (!schedule.length || schedule.some(s => !s.match(TEAM_SCHEDULE_PATTERN))) {
            throw Error(`Invalid schedule definition '${scheduleValue}', should be \`WEEK_DAY@HH:MM,\``);
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