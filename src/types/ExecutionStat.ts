import exp from "constants";

export interface ExecutionStatDay {
    day: string;  // YYYY-MM-DD
    succeeded: number; // count of successful executions
    failed: number;    // count of failed executions
    running: number;   // count of currently running executions
    pending: number;   // count of pending executions
}

export interface ExecutionStatDTO {
    total: number; // total number of executions in the period
    succeeded: number; // total successful executions
    failed: number;    // total failed executions
    running: number;   // total currently running executions
    success_rate: number; // success rate as a percentage
    total_definitions: number; // total number of job definitions
    per_day: ExecutionStatDay[]; // daily breakdown
}

export interface ExecutionStat {
    total: number; // total number of executions in the period
    succeeded: number; // total successful executions
    failed: number;    // total failed executions
    running: number;   // total currently running executions
    successRate: number; // success rate as a percentage
    totalDefinitions: number; // total number of job definitions
    perDay: ExecutionStatDay[]; // daily breakdown
}

export function mapExecutionStat(dto: ExecutionStatDTO): ExecutionStat {
    return {
        total: dto.total,
        succeeded: dto.succeeded,
        failed: dto.failed,
        running: dto.running,
        successRate: dto.success_rate,
        totalDefinitions: dto.total_definitions,
        perDay: dto.per_day.map(day => ({
            day: day.day,
            succeeded: day.succeeded,
            failed: day.failed,
            running: day.running,
            pending: day.pending
        }))
    };
}

export function emptyExecutionStat(): ExecutionStat {
    return {
        total: 0,
        succeeded: 0,
        failed: 0,
        running: 0,
        successRate: 0,
        totalDefinitions: 0,
        perDay: []
    };
}