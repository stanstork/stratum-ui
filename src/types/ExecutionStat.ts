import exp from "constants";
import { Connection, ConnectionDTO, mapConnection } from "./Connection";

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

export interface JobDefinitionStatDTO {
    id: string; // job definition ID
    tenant_id: string; // tenant ID
    name: string; // job definition name
    description: string; // job definition description
    source_connection_id: string; // source connection ID
    destination_connection_id: string; // destination connection ID
    source_connection: ConnectionDTO;
    destination_connection: ConnectionDTO;
    created_at: string; // creation timestamp
    updated_at: string; // update timestamp
    total_runs: number; // total number of job runs
    last_run_status: string; // status of the last job run
    total_bytes_transferred: number; // total bytes transferred
    avg_duration_seconds: number; // average duration in seconds
}

export interface JobDefinitionStat {
    id: string; // job definition ID
    tenantId: string; // tenant ID
    name: string; // job definition name
    description: string; // job definition description
    sourceConnectionId: string; // source connection ID
    destinationConnectionId: string; // destination connection ID
    sourceConnection: Connection;
    destinationConnection: Connection;
    createdAt: string; // creation timestamp
    updatedAt: string; // update timestamp
    totalRuns: number; // total number of job runs
    lastRunStatus: string; // status of the last job run
    totalBytesTransferred: number; // total bytes transferred
    avgDurationSeconds: number; // average duration in seconds
}

export function mapJobDefinitionStat(dto: JobDefinitionStatDTO): JobDefinitionStat {
    return {
        id: dto.id,
        tenantId: dto.tenant_id,
        name: dto.name,
        description: dto.description,
        sourceConnectionId: dto.source_connection_id,
        destinationConnectionId: dto.destination_connection_id,
        sourceConnection: mapConnection(dto.source_connection),
        destinationConnection: mapConnection(dto.destination_connection),
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
        totalRuns: dto.total_runs,
        lastRunStatus: dto.last_run_status,
        totalBytesTransferred: dto.total_bytes_transferred,
        avgDurationSeconds: dto.avg_duration_seconds
    };
}
