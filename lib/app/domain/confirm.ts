import { Match } from '@app/domain/match';

export interface ConfirmEvent {
    eventId: string,
    teamId: string,
    matchId: string,
    confirmation?: string,
    wm: number,
    playerId: string,
    playerName: string,
    version?: number
}

export interface ConfirmEventResult {
    event: ConfirmEvent,
    processed: boolean,
    match: Match
}