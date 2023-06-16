export interface Team {
    readonly id: string
    readonly name: string
    readonly created: Date
    /**
     * Pattern day_number@time, eg. Monday 08:00UTC - 1@08:00
     */
    schedule?: string[]
}