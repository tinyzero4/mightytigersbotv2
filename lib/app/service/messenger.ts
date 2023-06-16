import { Message } from 'typegram';
import { Context } from 'telegraf';

import { Team } from '@app/domain/team';

export class Messenger {

    async replyTeamInitialized(context: Context, team: Team) {
        await context.replyWithMarkdownV2(`***Team ${team.name} initialized***`);
    }

    async replyTeamScheduleChanged(context: Context, team: Team) {
        await context.replyWithMarkdownV2(`***Team schedule updated***`);
    }

    async replyError(context: Context, error: Error): Promise<Message.TextMessage> {
        return this.replyErrorMessage(context, error.message);
    }

    async replyErrorMessage(context: Context, error: string = 'Oops, smth went wrong'): Promise<Message.TextMessage> {
        return context.replyWithMarkdownV2(error);
    }

}