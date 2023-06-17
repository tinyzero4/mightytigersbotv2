import { TEAM_SCHEDULE_PATTERN } from '@app/service/config';
import * as moment from 'moment'

export class Team {

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly created: Date,
        private weeklySchedule?: string[]) {
    }

    get schedule(): string[] {
        return (this.weeklySchedule) ? [...this.weeklySchedule] : [];
    }

    reschedule(value: string) {
        const schedule = value.substring(value.lastIndexOf(" ")).trim().split(",");
        if (!schedule.length || schedule.some(s => !s.match(TEAM_SCHEDULE_PATTERN))) {
            throw Error(`Invalid schedule definition '${value}', should be \`WEEK_DAY@HH:MM,\``);
        }
        this.weeklySchedule = schedule.sort();
    }

    getNextEventDate(now: Date): Date {
        if (!this.schedule || !this.schedule.length) throw new Error('No schedule is defined')

        const nextOnCurrentWeek = this.schedule.map(event => this.eventToDate(event, now)).find(date => date > now);
        return nextOnCurrentWeek || this.eventToDate(this.schedule[0], moment.utc(now).add(1, "week").toDate());
    }

    private eventToDate(event: string, date: Date): Date {
        const [weekDay, time] = event.split("@")
        const [hour, minute] = time.split(":");
        return moment.utc(date)
            .isoWeekday(weekDay)
            .set({hour: parseInt(hour), minute: parseInt(minute)})
            .startOf("minute").toDate();
    }

}