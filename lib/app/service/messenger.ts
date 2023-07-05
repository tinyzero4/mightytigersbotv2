import { Message, User } from 'typegram';
import { Context, Markup } from 'telegraf';
import shortid from 'shortid';
import moment from 'moment';
import ejs from 'ejs';

import { Team } from '@app/domain/team';
import { Match } from '@app/domain/match';
import { MATCH_CONFIRMATION_TYPES, MATCH_WITH_ME_TYPES } from '@app/service/config';
import { InlineKeyboardMarkup } from 'telegraf/src/core/types/typegram';

export const matchDetailsTemplate = `|<b><%=startAt%></b>|Players: <strong><%=playersCount%></strong>|
<% confirmationTypes.forEach(function(type) { %>
<% let confirms = confirmations[type.value] -%>
<%=type.value %><b>[<%= confirms ? confirms.length : 0 %>]</b>
<% if (confirms) { -%>
<% confirms.forEach(function(p, i) { -%>
<i><%=i + 1%>.</i> <%= players[p.playerId] %> <% if (withMe[p.playerId] && withMe[p.playerId] > 0) { -%>(+<%=withMe[p.playerId]-%>) <% } -%> <i>@<%= moment.utc(p.ts).utcOffset(180).format('DD.MM HH:mm') %></i>
<% }) -%>
<% } -%>
<% }) -%>
`;

const teamStatsTemplate = `<b>Season appearances</b>(out of <i><%= matchesCount %></i> matches)
<% players.forEach(function(ps, i) { -%>
<i><%=i + 1%>.</i> <%= ps.name %> - <b><%= ps.appearances %></b>
<% }) -%>
`;

export class Messenger {

    async replyTeamInitialized(context: Context, team: Team) {
        await context.replyWithMarkdownV2(`***Success***`);
    }

    async replyTeamScheduleChanged(context: Context, team: Team) {
        await context.replyWithMarkdownV2(`***Team schedule updated***`);
    }

    async replyMatchDetails(context: Context, match: Match): Promise<Message> {
        try {
            const [message, extra] = this.prepareReplyMessageData(match);
            if (!message || !message.trim()) return {} as Message;

            return context.replyWithHTML(message, extra);
        } catch (e) {
            console.log(`[replyMatchDetails] issue`, e);
            return Promise.resolve({} as Message);
        }
    }

    async updateMatchDetails(context: Context, match: Match): Promise<true | Message> {
        try {
            const [message, extra] = this.prepareReplyMessageData(match);
            if (!message || !message.trim()) return {} as Message;

            return context.editMessageText(message, {parse_mode: 'HTML', ...extra});
        } catch (e) {
            console.log(`[updateMatchDetails] issue`, e);
            return Promise.resolve({} as Message);
        }
    }

    private prepareReplyMessageData(match: Match): [string, Markup.Markup<InlineKeyboardMarkup>] {
        const matchDetails = match.getDetails();
        const message = ejs.render(matchDetailsTemplate, {...matchDetails, moment});

        const actionsData = {id: matchDetails.id};
        const extra: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
            MATCH_CONFIRMATION_TYPES.map(type => Markup.button.callback(
                type.label,
                JSON.stringify({...actionsData, aid: shortid.generate(), c: type.value})
            )),
            MATCH_WITH_ME_TYPES.map(type => Markup.button.callback(
                type,
                JSON.stringify({...actionsData, aid: shortid.generate(), wm: type})
            )),
        ]);
        return [message, extra];
    }

    async replyMatchGreeting(context: Context) {
        await context.replyWithMarkdownV2(`*Go Go Go*`);
    }

    async replyInvalidMatch(context: Context, user: User): Promise<Message.TextMessage> {
        return await context.replyWithMarkdownV2(`${this.buildMention(user)}, You don't fool me!`);
    }

    async replyError(context: Context, error: Error = new Error('Oops, smth went wrong')): Promise<Message.TextMessage> {
        return this.replyErrorMessage(context, error.message);
    }

    async replyErrorMessage(context: Context, error: string = 'Oops, smth went wrong'): Promise<Message.TextMessage> {
        return context.replyWithHTML(error);
    }

    async pinMessage(context: Context, messageId: number) {
        await context.pinChatMessage(messageId);
    }

    buildMention(user: User) {
        return `[${this.buildUserName(user)}](tg://user?id=${user.id})`;
    };

    buildUserName(user: User) {
        return `${(user.first_name + (user.last_name || "")) || user.username}`;
    };

}