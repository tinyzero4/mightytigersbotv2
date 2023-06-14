export interface Team {
    id: string
    name: string
    created: Date
    /**
     * Pattern day_number@time, eg. 1@08:00
     */
    schedule?: string[]
}