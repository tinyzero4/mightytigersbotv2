import { Context, Telegraf } from 'telegraf';
import { Chat, Update } from 'typegram';

import { TeamService } from '@app/service/teamService';
import { Environment } from '@app/service/environment';
import { Messenger } from '@app/service/messenger';

export class UseCases {

    private readonly tg: Telegraf<Context<Update>>;

    constructor(env: Environment) {
        this.tg = new Telegraf(env.getBotToken());

        const cases = new TeamService();
        const messenger = new Messenger();

        this.tg.command('init', async (ctx) => {
            try {
                const {id, title} = ctx.chat as Chat.GroupChat;
                const team = await cases.initTeam(id.toString(), title);
                await messenger.replyTeamInitialized(ctx, team);
            } catch (e) {
                console.log('[init] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        this.tg.command('setschedule', async (ctx) => {
            try {
                const {id} = ctx.chat as Chat.GroupChat;
                const schedule = ctx.message.text.substring(ctx.message.text.lastIndexOf(" ") + 1);
                const team = await cases.setTeamSchedule(id.toString(), schedule);
                await messenger.replyTeamScheduleChanged(ctx, team);
            } catch (e) {
                console.log('[setschedule] issue: ', e);
                await messenger.replyError(ctx);
            }
        });

        this.tg.command('nextmatch', async (ctx) => {
            try {
                const {id} = ctx.chat as Chat.GroupChat;
                const match = await cases.resolveNextMatch(id.toString());
                if (!match.messageId) {
                    const message = await messenger.replyMatchDetails(ctx, match, true);
                    const linked = await cases.linkMatchDetailsMessage(id.toString(), match.id, message.message_id.toString());
                    if (linked) await messenger.replyMatchGreeting(ctx);
                }
                await messenger.pinMessage(ctx, Number(match.messageId));
            } catch (e) {
                console.log('[nextmatch] issue: ', e);
                await messenger.replyError(ctx);
            }
        });
    }

    async handle(command: string) {
        console.log(`handle: ${command}`);
        await this.tg.handleUpdate(JSON.parse(command));
    }
}