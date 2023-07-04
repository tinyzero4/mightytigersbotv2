import { Message } from 'typegram';
import { Context, Markup } from 'telegraf';
import shortid from 'shortid';
import ejs from 'ejs';

import { Team } from '@app/domain/team';
import { Match } from '@app/domain/match';
import { MATCH_CONFIRMATION_TYPES, MATCH_WITH_ME_TYPES } from '@app/service/config';

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
        await context.replyWithMarkdownV2(`***Team ${team.name} initialized***`);
    }

    async replyTeamScheduleChanged(context: Context, team: Team) {
        await context.replyWithMarkdownV2(`***Team schedule updated***`);
    }

    async replyMatchDetails(context: Context, match: Match, pin: boolean = true): Promise<Message> {
        const matchDetails = match.getDetails();
        try {
            const message = ejs.render(matchDetailsTemplate, matchDetails);
            if (!message.trim) return {} as Message;

            const actionsData = {id: matchDetails.id};
            return context.replyWithHTML(
                message,
                Markup.inlineKeyboard([
                    MATCH_CONFIRMATION_TYPES.map(type => Markup.button.callback(
                        type.label,
                        JSON.stringify({...actionsData, aid: shortid.generate(), c: type.value})
                    )),
                    MATCH_WITH_ME_TYPES.map(type => Markup.button.callback(
                        type,
                        JSON.stringify({...actionsData, aid: shortid.generate(), wm: type})
                    )),
                ])
            );
        } catch (e) {
            console.log(e);
            return {} as Message;
        }
    }

    async replyMatchGreeting(context: Context) {
        await context.replyWithMarkdownV2(`*Go Go Go*`);
    }

    async replyError(context: Context, error: Error = new Error('Oops, smth went wrong')): Promise<Message.TextMessage> {
        return this.replyErrorMessage(context, error.message);
    }

    async replyErrorMessage(context: Context, error: string = 'Oops, smth went wrong'): Promise<Message.TextMessage> {
        return context.replyWithHTML(error);
    }

    async pinMessage(context: Context, messageId: number) {
        await context.pinChatMessage(messageId)
    }

}