import { Context, Telegraf } from 'telegraf';
import { Chat, Update } from 'typegram';
import { UseCases } from './useCases';
import { AppEnvironment } from '../environment/appEnvironment';

export class CommandHandler {

    private readonly tg: Telegraf<Context<Update>>;
    private readonly useCases: UseCases;

    constructor(env: AppEnvironment) {
        this.useCases = new UseCases();
        this.tg = new Telegraf(env.getBotToken());

        this.tg.command('init', async (ctx) => {
            const chat = ctx.chat as Chat.GroupChat;
            const team = await this.useCases.initTeam(chat.id.toString(), chat.title);
            await ctx.replyWithHTML(`Success ${team.id}`);
        });
    }

    async handle(command: string) {
        await this.tg.handleUpdate(JSON.parse(command));
    }
}