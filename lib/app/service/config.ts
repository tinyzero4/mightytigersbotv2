export const VERSION = "2.0.0";

export const TEAM_SCHEDULE_DEFAULTS = ["2@05:30", "4@05:30"];
export const TEAM_SCHEDULE_PATTERN = /^[1-7]@[0-9]{2}:[0-5][0-9]$/;

export const MATCH_CONFIRMATION_TYPE_Y = '⚽';
export const MATCH_CONFIRMATION_TYPE_N = '🍷';
export const MATCH_CONFIRMATION_TYPE_M = '🤔';
export const MATCH_CONFIRMATION_TYPES = [
    {value: MATCH_CONFIRMATION_TYPE_Y, label: `${MATCH_CONFIRMATION_TYPE_Y}[PLAY]`},
    {value: MATCH_CONFIRMATION_TYPE_N, label: `${MATCH_CONFIRMATION_TYPE_N}[SLEEP]`},
    {value: MATCH_CONFIRMATION_TYPE_M, label: `${MATCH_CONFIRMATION_TYPE_M}[?]`},
];
export const MATCH_WITH_ME_PLUS_ONE = "+1";
export const MATCH_WITH_ME_MINUS_ONE = "-1";
export const MATCH_WITH_ME_TYPES = [MATCH_WITH_ME_PLUS_ONE, MATCH_WITH_ME_MINUS_ONE]
export const MATCH_MIN_PLAYERS = 8;

export const AWS_DYNAMODB_MAIN_TABLE_NAME = 'mighty-tigers-data';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_PARAM_BOT_TOKEN = '/tg/TG_BOT_TOKEN';