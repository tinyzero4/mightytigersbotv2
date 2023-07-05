import { Context, Telegraf } from 'telegraf';
import { CallbackQuery, Chat, Update } from 'typegram';

import { TeamService } from '@app/service/teamService';
import { Environment } from '@app/service/environment';
import { Messenger } from '@app/service/messenger';
import DataQuery = CallbackQuery.DataQuery;
import { ConfirmEvent } from '@app/domain/confirm';

export class UseCases {

    private readonly tg: Telegraf<Context<Update>>;

    constructor(env: Environment) {
        this.tg = new Telegraf(env.getBotToken());

        const teamService = new TeamService();
        const messenger = new Messenger();

        this.tg.command('init', async (ctx) => {
            try {
                const [teamId, teamName] = resolveTeam(ctx);

                const team = await teamService.initTeam(teamId, teamName);
                await messenger.replyTeamInitialized(ctx, team);
            } catch (e) {
                console.log('[init] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        this.tg.command('setschedule', async (ctx) => {
            try {
                const [teamId] = resolveTeam(ctx);
                const schedule = ctx.message.text.substring(ctx.message.text.lastIndexOf(" ") + 1);

                const team = await teamService.setTeamSchedule(teamId, schedule);
                await messenger.replyTeamScheduleChanged(ctx, team);
            } catch (e) {
                console.log('[setschedule] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        this.tg.command('nextmatch', async (ctx) => {
            try {
                const [teamId] = resolveTeam(ctx);

                const match = await teamService.getNextMatch(teamId);
                if (!match.isLinked()) {
                    const message = await messenger.replyMatchDetails(ctx, match);
                    const linked = await teamService.linkMatchDetailsMessage(teamId, match.id, message.message_id.toString());
                    if (linked) {
                        await messenger.replyMatchGreeting(ctx);
                        await messenger.pinMessage(ctx, message.message_id);
                    }
                }
            } catch (e) {
                console.log('[nextmatch] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        this.tg.on('callback_query', async (ctx) => {
            try {
                const [teamId] = resolveTeam(ctx);
                const {data, from} = ctx.callbackQuery as DataQuery;
                const callbackData = JSON.parse(data);

                const event: ConfirmEvent = {
                    eventId: callbackData.aid,
                    teamId,
                    matchId: callbackData.id,
                    confirmation: callbackData.c,
                    wm: parseInt(callbackData.wm || 0),
                    playerId: from.id.toString(),
                    playerName: messenger.buildUserName(from)
                };

                const match = await teamService.getMatch(event.teamId, event.matchId);
                if (!match || match.isAllBetsAreOff()) {
                    await messenger.replyInvalidMatch(ctx, from);
                    return;
                }

                const result = await teamService.processMatchConfirmEvent(match, event);
                if (result.processed) await messenger.updateMatchDetails(ctx, result.match);
            } catch (e) {
                console.log('[callback_query] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        const resolveTeam = (ctx: Context): [string, string] => {
            const {id, title} = ctx.chat as Chat.GroupChat;
            return [id.toString(), title];
        };

    }

    async handle(command: string) {
        await this.tg.handleUpdate(JSON.parse(command));
    }
}