import moment from 'moment/moment';
import { MATCH_CONFIRMATION_TYPE_Y, MATCH_CONFIRMATION_TYPES } from '@app/service/config';

export enum MatchStatus {
    SCHEDULED,
    COMPLETED
}

export interface Confirmation {
    playerId: string;
    confirmation: string;
    ts: number;
}

export interface Squad {
    [playerId: string]: Confirmation;
}

export interface WithMe {
    [playerId: string]: number;
}

export interface PlayersNames {
    [playerId: string]: string;
}

export interface MatchDetails {
    id: string
    uid: string
    teamId: string
    startAt: string,
    playersCount: number,
    confirmations: Record<string, Confirmation[]>,
    withMe: WithMe,
    players: PlayersNames,
    confirmationTypes: any[],
}

export class Match {

    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly start: Date,
        public readonly messageId?: string,
        public readonly squad: Squad = {},
        public readonly withMe: WithMe = {},
        public readonly players: PlayersNames = {},
        private status: MatchStatus = MatchStatus.SCHEDULED,
        public readonly created: Date = new Date(),
        public readonly version: number = 0
    ) {
    }

    getTotalPlayers(): number {
        const countWm = Object.values(this.withMe).filter(v => v > 0).reduce((a, b) => a + b, 0);
        const countDirect = Object.values(this.squad).filter(v => v.confirmation == MATCH_CONFIRMATION_TYPE_Y).length;
        return countDirect + countWm;
    }

    hasCompleted(): boolean {
        return this.status == MatchStatus.COMPLETED;
    }

    hasStarted(): boolean {
        return this.start < new Date();
    }

    isAllBetsAreOff(): boolean {
        return this.hasCompleted() || this.hasStarted();
    }

    isLinked(): boolean {
        return !!this.messageId;
    }

    complete() {
        this.status = MatchStatus.COMPLETED;
    }

    private getConfirmationsByType(): Record<string, Confirmation[]> {
        return Object.values(this.squad)
            .reduce((acc: Record<string, Confirmation[]>, c: Confirmation) => {
                acc[c.confirmation] = acc[c.confirmation] || [];
                acc[c.confirmation].push(c);
                return acc;
            }, {});
    }

    getDetails(): MatchDetails {
        return {
            id: this.id,
            uid: this.id,
            teamId: this.teamId,
            startAt: moment.utc(this.start).utcOffset(180).format("ddd,DD.MM@HH:mm"),
            confirmations: this.getConfirmationsByType(),
            players: this.players,
            withMe: this.withMe,
            playersCount: this.getTotalPlayers(),
            confirmationTypes: MATCH_CONFIRMATION_TYPES,
        };
    }
}