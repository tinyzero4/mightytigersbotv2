import { Context, Telegraf } from 'telegraf';
import { Chat, Update } from 'typegram';

import { UseCases } from '@app/service/useCases';
import { Environment } from '@app/service/environment';
import { Messenger } from '@app/service/messenger';

export class CommandHandler {

    private readonly tg: Telegraf<Context<Update>>;

    constructor(env: Environment) {
        this.tg = new Telegraf(env.getBotToken());

        const cases = new UseCases();
        const messenger = new Messenger();

        this.tg.command('init', async (ctx) => {
            try {
                const {id, title} = ctx.chat as Chat.GroupChat;
                const team = await cases.initTeam(id.toString(), title);
                await messenger.replyTeamInitialized(ctx, team);
            } catch (e) {
                console.log('[init] issue: ', e);
                await messenger.replyError(ctx, (e instanceof Error) ? e : new Error('init issue'));
            }
        });

        this.tg.command('setschedule', async (ctx) => {
            try {
                const {id} = ctx.chat as Chat.GroupChat;
                const scheduleValue = ctx.message.text.substring(ctx.message.text.lastIndexOf(" ") + 1)
                const team = await cases.setTeamSchedule(id.toString(), scheduleValue);
                await messenger.replyTeamScheduleChanged(ctx, team);
            } catch (e) {
                console.log('[setschedule] issue: ', e);
                await messenger.replyError(ctx, (e instanceof Error) ? e : new Error('setschedule issue'));
            }
        });
    }

    async handle(command: string) {
        await this.tg.handleUpdate(JSON.parse(command));
    }
}