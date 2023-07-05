import { Team } from '@app/domain/team';
import { Match } from '@app/domain/match';
import { DataRepository } from '@app/service/dataRepository';
import { TEAM_SCHEDULE_DEFAULTS } from '@app/service/config';
import { ConfirmEvent, ConfirmEventResult } from '@app/domain/confirm';

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

    async getMatch(teamId: string, matchId: string): Promise<Match> {
        return this.repository.getMatch(teamId, matchId);
    }

    async getNextMatch(teamId: string): Promise<Match> {
        const team = await this.repository.getTeam(teamId);
        const when = team.getNextEventDate();
        return await this.repository.initMatch(teamId, when.getTime().toString(), when);
    }

    async linkMatchDetailsMessage(teamId: string, matchId: string, messageId: string): Promise<boolean> {
        return await this.repository.linkMatchDetailsMessage(teamId, matchId, messageId);
    }

    async processMatchConfirmEvent(match: Match, event: ConfirmEvent): Promise<ConfirmEventResult> {
        const latestEvent = await this.repository.trackConfirmEvent(event);
        if ((latestEvent.version || 0) > 1) return {event: latestEvent, processed: false, match};

        const {teamId, matchId, confirmation, wm, playerId, playerName} = latestEvent;

        let latest = match;

        if (wm) latest = await this.repository.confirmWithMe(teamId, matchId, playerId, playerName, wm);
        else if (confirmation) latest = await this.repository.confirm(teamId, matchId, playerId, playerName, confirmation);

        return {event: latestEvent, processed: true, match: latest};
    }

}