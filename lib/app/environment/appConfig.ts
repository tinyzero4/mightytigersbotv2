export const VERSION = "2.0.0"

export const TEAM_DEFAULT_SCHEDULE = ["2@05:30", "4@05:30"]

export const MATCH_ACK_TYPES = [
    {value: "⚽", label: "⚽[PLAY]", going: true},
    {value: "🍷", label: "🍷[SLEEP]", going: false},
    {value: "🤔", label: "🤔[?]", going: false},
]
export const MATCH_WITH_ME_TYPES = ["+1", "-1"]
export const MATCH_MIN_PLAYERS = 8

export const AWS_DYNAMODB_MAIN_TABLE_NAME = 'mighty-tigers-data'
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
export const AWS_PARAM_BOT_TOKEN = '/tg/BOT_TOKEN'